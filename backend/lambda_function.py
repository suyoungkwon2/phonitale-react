import json
import boto3
from datetime import datetime
from typing import Dict, Any

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('phonitale-user-responses')

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    try:
        # Print event for debugging
        print("Received event:", json.dumps(event))
        
        # Parse the event data
        if isinstance(event, str):
            body = json.loads(event)
        elif isinstance(event.get('body'), str):
            body = json.loads(event['body'])
        else:
            body = event.get('body', event)
            
        print("Parsed body:", json.dumps(body))
        
        # Extract data from body
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
        expression_attribute_names = {}
        
        # Add round number if it's the first time for this word
        update_expression.append("#rn = if_not_exists(#rn, :round_number)")
        expression_attribute_names["#rn"] = "round_number"
        expression_attribute_values[":round_number"] = round_number
        
        # Add timestamp for the specific page type
        timestamp_attr = f"timestamp_{page_type}"
        update_expression.append(f"#{timestamp_attr} = :timestamp")
        expression_attribute_names[f"#{timestamp_attr}"] = timestamp_attr
        expression_attribute_values[":timestamp"] = current_timestamp
        
        # Add duration for the specific page type
        duration_attr = f"duration_{page_type}"
        update_expression.append(f"#{duration_attr} = :duration")
        expression_attribute_names[f"#{duration_attr}"] = duration_attr
        expression_attribute_values[":duration"] = duration
        
        # Add response if it's recognition or generation
        if page_type in ['recognition', 'generation']:
            response_attr = f"response_{page_type}"
            update_expression.append(f"#{response_attr} = :response")
            expression_attribute_names[f"#{response_attr}"] = response_attr
            expression_attribute_values[":response"] = response
        
        # Add survey response if it's survey
        if page_type == 'survey':
            update_expression.append("#survey = :survey")
            expression_attribute_names["#survey"] = "survey"
            expression_attribute_values[":survey"] = response
        
        # Update or create item in DynamoDB
        table.update_item(
            Key={
                'user': user,
                'english_word': english_word
            },
            UpdateExpression="SET " + ", ".join(update_expression),
            ExpressionAttributeValues=expression_attribute_values,
            ExpressionAttributeNames=expression_attribute_names
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
        print("Error occurred:", str(e))
        print("Event that caused error:", json.dumps(event))
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