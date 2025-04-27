import json
import boto3
from datetime import datetime
from typing import Dict, Any
import traceback # 에러 로깅 강화

dynamodb = boto3.resource('dynamodb')
table_responses = dynamodb.Table('phonitale-user-responses')
table_consent = dynamodb.Table('phonitale-user-consent')

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
            consent_timestamp = datetime.now().strftime('%Y-%m-%d-%H-%M-%S')

            table_consent.put_item(
                Item={
                    'email': email,
                    'name': name,
                    'phone': phone,
                    'consent_agreed': consent_agreed,
                    'consent_agreed_date': consent_timestamp
                }
            )
            print(f"Consent data saved for email: {email}")

            response_body = {
                'message': 'Consent recorded successfully',
                'userId': user_id_for_responses
            }

        # 2. 실험 응답 저장 (POST 요청 - 경로 미지정 임시 처리)
        # TODO: 향후 /responses 경로 추가 권장
        elif http_method == 'POST': # /consent 외의 다른 POST 요청 처리
            print(f"Handling generic POST for path: {path}") # 추가 로깅
            body = parse_event_body(event)
            user = body.get('user') # 프론트에서 받은 userId (name#phone)
            english_word = body.get('english_word')

            if not all([user, english_word]):
                 raise ValueError("Missing required fields: user, english_word")

            round_number = body.get('round_number', 1)
            page_type = body.get('page_type', 'unknown')
            duration = body.get('duration', 0)
            response_data = body.get('response', 'N/A') # 키 이름 변경 (response는 변수명으로 사용중)
            survey_rating = body.get('survey_rating') # Survey 평점
            current_timestamp = datetime.now().isoformat()

            update_expression = []
            expression_attribute_values = {}
            expression_attribute_names = {}

            update_expression.append("#rn = if_not_exists(#rn, :round_number)")
            expression_attribute_names["#rn"] = "round_number"
            expression_attribute_values[":round_number"] = round_number

            timestamp_attr = f"timestamp_{page_type}"
            update_expression.append(f"#{timestamp_attr} = :timestamp")
            expression_attribute_names[f"#{timestamp_attr}"] = timestamp_attr
            expression_attribute_values[":timestamp"] = current_timestamp

            duration_attr = f"duration_{page_type}"
            update_expression.append(f"#{duration_attr} = :duration")
            expression_attribute_names[f"#{duration_attr}"] = duration_attr
            expression_attribute_values[":duration"] = duration

            if page_type in ['recognition', 'generation']:
                response_attr = f"response_{page_type}"
                update_expression.append(f"#{response_attr} = :response_data")
                expression_attribute_names[f"#{response_attr}"] = response_attr
                expression_attribute_values[":response_data"] = response_data # 변수명 충돌 피하기

            if page_type == 'survey' and survey_rating is not None:
                update_expression.append("#survey_rating = :survey_rating")
                expression_attribute_names["#survey_rating"] = "survey_rating"
                expression_attribute_values[":survey_rating"] = survey_rating
            elif page_type == 'survey': # survey_rating이 없을 경우 response_data 사용 (선택적)
                update_expression.append("#survey_response = :survey_response")
                expression_attribute_names["#survey_response"] = "survey_response"
                expression_attribute_values[":survey_response"] = response_data


            table_responses.update_item(
                Key={
                    'user': user,
                    'english_word': english_word
                },
                UpdateExpression="SET " + ", ".join(update_expression),
                ExpressionAttributeValues=expression_attribute_values,
                ExpressionAttributeNames=expression_attribute_names
            )
            print(f"Experiment response saved for user: {user}, word: {english_word}")

            response_body = {
                'message': 'Experiment response recorded successfully'
            }

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