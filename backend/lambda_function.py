import json
import boto3
from datetime import datetime, timezone
from typing import Dict, Any, Union
import traceback # 에러 로깅 강화

dynamodb = boto3.resource('dynamodb')
table_responses = dynamodb.Table('phonitale-user-responses')
table_consent = dynamodb.Table('phonitale-user-consent')

# ISO 8601 문자열을 datetime 객체로 파싱하는 헬퍼 함수
def parse_isoformat(timestamp_str: str) -> Union[datetime, None]:
    if not timestamp_str:
        return None
    try:
        # ISO 8601 형식에 Z가 포함될 수 있으므로 처리
        if timestamp_str.endswith('Z'):
            timestamp_str = timestamp_str[:-1] + '+00:00'
        return datetime.fromisoformat(timestamp_str)
    except (ValueError, TypeError):
        print(f"Error parsing timestamp: {timestamp_str}")
        return None

def parse_event_body(event: Dict[str, Any]) -> Dict[str, Any]:
    """Helper function to parse request body from API Gateway event"""
    print("Received raw event:", json.dumps(event)) # Raw event 로깅
    body_str = event.get('body', '{}') # 기본값으로 빈 JSON 문자열
    if not isinstance(body_str, str):
        # Body가 이미 파싱된 경우 (테스트 등)
        print("Body is already parsed:", json.dumps(body_str))
        return body_str if isinstance(body_str, dict) else {}

    if not body_str:
        body_str = '{}'

    try:
        body = json.loads(body_str)
        print("Parsed body:", json.dumps(body))
        return body
    except json.JSONDecodeError as e:
        print(f"Error decoding JSON body: {e}")
        print(f"Body content was: {body_str}")
        raise ValueError("Invalid JSON format in request body")

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    # === DEBUGGING: Print the entire event object ===
    print("START: Received Event Object:")
    print(json.dumps(event))
    print("END: Received Event Object")
    # === END DEBUGGING ===
    try:
        http_method = event.get('httpMethod', 'UNKNOWN')
        path = event.get('path', '/') # API Gateway 경로

        # === DEBUGGING: Print extracted path and method ===
        print(f"Extracted httpMethod: {http_method}")
        print(f"Extracted path: {path}")
        # === END DEBUGGING ===

        print(f"Processing {http_method} request for path: {path}")

        # Default response setup
        status_code = 200
        response_body = {}

        # =========================================
        # API 라우팅: 경로와 메소드 기반 분기
        # =========================================

        # 1. Consent 정보 처리 (POST /consent)
        if path.endswith('/consent') and http_method == 'POST':
            body = parse_event_body(event)
            name = body.get('name')
            phone = body.get('phone')
            email = body.get('email')
            consent_agreed = body.get('consent_agreed', False)

            if not all([name, phone, email]):
                raise ValueError("Missing required fields: name, phone, email")

            user_id_for_responses = f"{name}#{phone}"
            consent_timestamp = datetime.now(timezone.utc).isoformat() # ISO 8601 형식 (UTC 기준)

            table_consent.put_item(
                Item={
                    'email': email,
                    'name': name,
                    'phone': phone,
                    'consent_agreed': consent_agreed,
                    'consent_agreed_date': consent_timestamp
                }
            )
            print(f"Consent data saved for email: {email}, name: {name}")

            response_body = {
                'message': 'Consent recorded successfully',
                'userId': user_id_for_responses,
                'userEmail': email,
                'userName': name,
                'consentTimestamp': consent_timestamp
            }

        # 2. 실험 응답 저장 (POST /responses)
        elif path.endswith('/responses') and http_method == 'POST':
            print(f"Handling POST for path: {path}") # 경로 명시
            body = parse_event_body(event)
            user = body.get('user') # 프론트에서 받은 userId (name#phone) or email/name?
            english_word = body.get('english_word')
            timestamp_in = body.get('timestamp_in')
            timestamp_out = body.get('timestamp_out')

            # 1. page_type 먼저 확인
            page_type = body.get('page_type', 'unknown')

            # =======================================
            # == final_summary 페이지 타입 특별 처리 ==
            # =======================================
            if page_type == 'final_summary':
                email = body.get('email')
                name = body.get('name')
                test_end_timestamp_str = body.get('test_end_timestamp') # 프론트에서 받은 종료 시각

                if not email or not name:
                    raise ValueError("Missing required fields: email, name for final_summary")
                if not test_end_timestamp_str:
                    raise ValueError("Missing required field: test_end_timestamp for final_summary")

                print(f"Processing final_summary for email: {email}, name: {name}")

                try:
                    # 1. Consent 정보 조회 (consent_agreed_date 얻기)
                    response = table_consent.get_item(
                        Key={'email': email, 'name': name}
                    )
                    consent_item = response.get('Item')

                    if not consent_item:
                        raise ValueError(f"Consent record not found for email: {email}, name: {name}")

                    consent_agreed_date_str = consent_item.get('consent_agreed_date')
                    if not consent_agreed_date_str:
                         raise ValueError(f"consent_agreed_date not found in consent record for email: {email}, name: {name}")

                    # 2. 시간 파싱 및 total_duration 계산
                    consent_dt = parse_isoformat(consent_agreed_date_str)
                    test_end_dt = parse_isoformat(test_end_timestamp_str)

                    if not consent_dt or not test_end_dt:
                        raise ValueError("Could not parse consent_agreed_date or test_end_timestamp")

                    # 시간대 인식 datetime 객체인지 확인 (isoformat()은 기본적으로 시간대 포함)
                    if consent_dt.tzinfo is None or test_end_dt.tzinfo is None:
                         print("Warning: Timestamps might be naive. Assuming UTC for calculation.")
                         # 필요시 시간대 강제 지정: consent_dt = consent_dt.replace(tzinfo=timezone.utc)

                    total_duration_seconds = round((test_end_dt - consent_dt).total_seconds())
                    print(f"Calculated total_duration: {total_duration_seconds} seconds")

                    # 3. Consent 테이블 업데이트 (test_end, total_duration 추가)
                    table_consent.update_item(
                        Key={'email': email, 'name': name},
                        UpdateExpression="SET #te = :test_end, #td = :total_duration",
                        ExpressionAttributeNames={
                            '#te': 'test_end',
                            '#td': 'total_duration'
                        },
                        ExpressionAttributeValues={
                            ':test_end': test_end_timestamp_str, # ISO 문자열로 저장
                            ':total_duration': total_duration_seconds
                        }
                    )
                    print(f"Final summary (test_end, total_duration) saved for email: {email}, name: {name}")

                    response_body = {'message': 'Final summary recorded successfully'}
                    # final_summary 처리는 여기서 종료

                except Exception as e:
                    print(f"Error processing final_summary for {email}, {name}: {e}")
                    traceback.print_exc()
                    # status_code = 500 # 또는 400 (잘못된 데이터)
                    raise e # 에러를 다시 발생시켜 공통 에러 처리 로직에서 처리하도록 함

            # =======================================
            # == 다른 페이지 타입 처리 (기존 로직) ==
            # =======================================
            else:
                # user 필드는 항상 필수 (final_summary 외)
                if not user:
                    raise ValueError("Missing required field: user")

                # final_summary가 아닐 경우에만 english_word 필드 확인
                if not english_word:
                     raise ValueError("Missing required field: english_word")

                round_number = body.get('round_number', 1)
                duration = body.get('duration')
                response_data = body.get('response', 'N/A')

                update_expression = []
                expression_attribute_values = {}
                expression_attribute_names = {}

                # 공통 속성: 라운드 번호
                update_expression.append("#rn = if_not_exists(#rn, :round_number)")
                expression_attribute_names["#rn"] = "round_number"
                expression_attribute_values[":round_number"] = round_number

                # 페이지 타입별 timestamp_in, timestamp_out, duration, response 처리
                if page_type in ['learning', 'recognition', 'generation']:
                    timestamp_in_attr = f"timestamp_{page_type}_in"
                    timestamp_out_attr = f"timestamp_{page_type}_out"
                    duration_attr = f"duration_{page_type}"

                    if timestamp_in:
                        update_expression.append(f"#{timestamp_in_attr} = :ts_in")
                        expression_attribute_names[f"#{timestamp_in_attr}"] = timestamp_in_attr
                        expression_attribute_values[":ts_in"] = timestamp_in
                    else:
                        print(f"Warning: timestamp_in not provided for {user} - {english_word} - page: {page_type}")

                    if timestamp_out:
                        update_expression.append(f"#{timestamp_out_attr} = :ts_out")
                        expression_attribute_names[f"#{timestamp_out_attr}"] = timestamp_out_attr
                        expression_attribute_values[":ts_out"] = timestamp_out
                    else:
                        print(f"Warning: timestamp_out not provided for {user} - {english_word} - page: {page_type}")

                    if duration is not None:
                        update_expression.append(f"#{duration_attr} = :duration")
                        expression_attribute_names[f"#{duration_attr}"] = duration_attr
                        expression_attribute_values[":duration"] = duration
                    else:
                        print(f"Warning: duration not provided for {user} - {english_word} - page: {page_type}")

                    if page_type in ['recognition', 'generation']:
                        response_attr = f"response_{page_type}"
                        update_expression.append(f"#{response_attr} = :response_data")
                        expression_attribute_names[f"#{response_attr}"] = response_attr
                        expression_attribute_values[":response_data"] = response_data

                elif page_type == 'survey':
                    survey_submit_timestamp = datetime.now(timezone.utc).isoformat() # ISO 형식 사용
                    timestamp_attr = f"timestamp_{page_type}"
                    update_expression.append(f"#{timestamp_attr} = :survey_ts")
                    expression_attribute_names[f"#{timestamp_attr}"] = timestamp_attr
                    expression_attribute_values[":survey_ts"] = survey_submit_timestamp

                    usefulness = body.get('usefulness')
                    coherence = body.get('coherence')

                    if usefulness is not None:
                        update_expression.append("#usefulness = :usefulness")
                        expression_attribute_names["#usefulness"] = "usefulness"
                        expression_attribute_values[":usefulness"] = usefulness
                    else:
                        print(f"Warning: usefulness rating not provided for {user} - {english_word}")

                    if coherence is not None:
                        update_expression.append("#coherence = :coherence")
                        expression_attribute_names["#coherence"] = "coherence"
                        expression_attribute_values[":coherence"] = coherence
                    else:
                         print(f"Warning: coherence rating not provided for {user} - {english_word}")

                else:
                    print(f"Warning: Unknown page_type '{page_type}' encountered for user: {user}, word: {english_word}. No specific data recorded.")

                # DynamoDB 업데이트 실행 (table_responses)
                if update_expression:
                    table_responses.update_item(
                        Key={
                            'user': user,
                            'english_word': english_word
                        },
                        UpdateExpression="SET " + ", ".join(update_expression),
                        ExpressionAttributeValues=expression_attribute_values,
                        ExpressionAttributeNames=expression_attribute_names
                    )
                    print(f"Experiment response saved/updated for user: {user}, word: {english_word}, page: {page_type}")
                else:
                    print(f"No updates to perform for user: {user}, word: {english_word}, page: {page_type}")

                # final_summary가 아닌 경우에만 이 메시지 사용
                response_body = {'message': 'Experiment response recorded successfully'}

        # 3. 다른 API 경로 및 메소드 처리 (예: GET /words)
        # elif path == '/words' and http_method == 'GET':
        #     # 단어 목록 로드 로직 구현 (예: S3 CSV 파일 읽기)
        #     pass

        else:
            # 지원하지 않는 경로 또는 메소드
            print(f"Unsupported path or method: {http_method} {path}")
            status_code = 404
            response_body = {'error': f'Resource not found or method not allowed: {path}'}

        # 공통 응답 반환 (Lambda 프록시 통합 형식 준수)
        return {
            'statusCode': status_code,
            'headers': {
                'Access-Control-Allow-Origin': '*', # 중요: 실제 배포 시에는 React 앱 도메인으로 제한!
                'Access-Control-Allow-Headers': 'Content-Type', # 필요한 헤더 명시
                'Access-Control-Allow-Methods': 'OPTIONS,POST,GET' # 허용할 메소드 명시
            },
            'body': json.dumps(response_body)
        }

    except ValueError as ve:
        print(f"Value error: {ve}")
        return {
            'statusCode': 400, # Bad Request
            'headers': { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'OPTIONS,POST,GET' },
            'body': json.dumps({'error': str(ve)})
        }
    except Exception as e:
        print(f"Internal server error: {e}")
        traceback.print_exc() # 상세 에러 스택 로깅
        return {
            'statusCode': 500,
            'headers': { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'OPTIONS,POST,GET' },
            'body': json.dumps({'error': 'An internal error occurred.'})
        } 