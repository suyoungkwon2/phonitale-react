import json
import boto3
from datetime import datetime
from typing import Dict, Any

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('phonitale-user-responses')

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    try:
        # Parse the event data
        body = json.loads(event['body'])
        user_name = body['user_name']
        phone_number = body['phone_number']
        english_word = body['english_word']
        round_number = body['round_number']
        page_type = body['page_type']
        duration = body['duration']
        response = body.get('response', 'N/A')
        
        # Create keys
        user = f"{user_name}#{phone_number}"
        
        # Get current timestamp
        current_timestamp = datetime.now().isoformat()
        
        # Prepare update expression and attribute values
        update_expression = []
        expression_attribute_values = {}
        
        # Add round number if it's the first time for this word
        update_expression.append("round_number = if_not_exists(round_number, :round_number)")
        expression_attribute_values[":round_number"] = round_number
        
        # Add timestamp for the specific page type
        timestamp_key = f"timestamp-{page_type}"
        update_expression.append(f"{timestamp_key} = :{timestamp_key}")
        expression_attribute_values[f":{timestamp_key}"] = current_timestamp
        
        # Add duration for the specific page type
        duration_key = f"duration-{page_type}"
        update_expression.append(f"{duration_key} = :{duration_key}")
        expression_attribute_values[f":{duration_key}"] = duration
        
        # Add response if it's recognition or generation
        if page_type in ['recognition', 'generation']:
            response_key = f"response-{page_type}"
            update_expression.append(f"{response_key} = :{response_key}")
            expression_attribute_values[f":{response_key}"] = response
        
        # Add survey response if it's survey
        if page_type == 'survey':
            update_expression.append("survey = :survey")
            expression_attribute_values[":survey"] = response
        
        # Update or create item in DynamoDB
        table.update_item(
            Key={
                'user': user,
                'english_word': english_word
            },
            UpdateExpression="SET " + ", ".join(update_expression),
            ExpressionAttributeValues=expression_attribute_values
        )
        
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': '*',
                'Access-Control-Allow-Methods': '*'
            },
            'body': json.dumps({
                'message': 'Response recorded successfully',
                'user_name': user_name,
                'phone_number': phone_number,
                'english_word': english_word,
                'round_number': round_number,
                'page_type': page_type,
                'timestamp': current_timestamp,
                'duration': duration,
                'response': response
            })
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': '*',
                'Access-Control-Allow-Methods': '*'
            },
            'body': json.dumps({
                'error': str(e)
            })
        } 