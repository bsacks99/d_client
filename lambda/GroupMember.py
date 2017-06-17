
import boto3
import json
import uuid
import time
from boto3.dynamodb.conditions import Key, Attr

print('Loading function')
dynamo = boto3.client('dynamodb')


def respond(err, res=None):
    return {
        'statusCode': err['status'] if err else '200',
        'body': err['message'] if err else json.dumps(res),
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*' 
        },
    }


def lambda_handler(event, context):
    '''Demonstrates a simple HTTP endpoint using API Gateway. You have full
    access to the request and response payload, including headers and
    status code.

    To scan a DynamoDB table, make a GET request with the TableName as a
    query string parameter. To put, update, or delete an item, make a POST,
    PUT, or DELETE request respectively, passing in the payload to the
    DynamoDB API as a JSON body.
    '''
    #print("Received event: " + json.dumps(event, indent=2))
    
    table = 'GroupMembers'

    operations = {
        'DELETE': lambda dynamo, x: dynamo.delete_item(**x),
        'GET': lambda dynamo, x: dynamo.scan(**x),
        'POST': lambda dynamo, x: dynamo.put_item(**x),
        'PUT': lambda dynamo, x: dynamo.update_item(**x),
    }

    operation = event['httpMethod']
    if operation in operations:
        payload = None
        if operation == 'GET':
            qs = event['queryStringParameters']
 
            payload = {
                'TableName': table,
                'ScanFilter': {"member":{"AttributeValueList":[{"S": qs['email']}], "ComparisonOperator":"EQ"}},
            }
            
            response = operations[operation](dynamo, payload)
            
            group = None
            
            if not response:
                return respond({'message': 'No group member found', 'status': 404})
                
            try:
                group = response['Items'][0]['group_id']['S']
            except:
                return respond({'message': 'No group member found', 'status': 404})
                
            if response:
                return respond(None, {'group_id': group})
        elif operation in ['POST', 'PUT']:
            items = json.loads(event['body'])
            new_id = uuid.uuid4()
            payload = {
                'TableName': table,
                'Item': {
                    'id': {'S': str(new_id)},
                    'group_id': {'S': items['group_id']},
                    'member': {'S': items['member']},
                    'created': {'N': str(int(time.time()))}
                }
            }
            response = operations[operation](dynamo, payload)
            if response:
                return respond(None, {'member_id': str(new_id)})
        else:
            return respond({'message': 'Unsupported method "{}"'.format(operation), 'status': 400})
        
        return respond(None, operations[operation](dynamo, payload))
    else:
        return respond({'message': 'Unsupported method "{}"'.format(operation), 'status': 400})
