
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
    
    table = 'Groups'

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
            
            group_id = None
            name = None
            
            try:
                group_id = qs['group_id']
            except:
                pass
            try:
                name = qs['group_name']
            except:
                pass
            
            if (group_id is None or group_id == 'undefined') and (name is None or name == 'undefined'):
                return respond({'message': 'Invalid arguements', 'status': 400})
                
            scan_filter = None
            if group_id is not None and group_id != 'undefined':
                scan_filter = {"id":{"AttributeValueList":[{"S": group_id}], "ComparisonOperator":"EQ"}}
            if name is not None and name != 'undefined':
                scan_filter = {"name":{"AttributeValueList":[{"S": name}], "ComparisonOperator":"EQ"}}
                
            payload = {
                'TableName': table,
                'ScanFilter': scan_filter,
            }
            
            response = operations[operation](dynamo, payload)
            
            group = None
            group_id = None
            
            if not response:
                return respond({'message': 'No group found', 'status': 404})
            
            members = []
            try:
                if qs['get_members'] == 'true':
                    dynamotmp = boto3.resource('dynamodb')
                    working_table = dynamotmp.Table('GroupMembers')
                    mresponse = working_table.scan(  
                        FilterExpression=Attr('group_id').eq(response['Items'][0]['id']['S'])
                    )
                    if mresponse:
                        for item in mresponse['Items']:
            
                            try:
                                member = item['member']
                            except Exception as e:
                                return respond({'message': e, 'status': 500})
                            
                            members.append({'member': member})
                            
            except Exception as e:
                pass
                
            try:
                group = response['Items'][0]['name']['S']
                group_id = response['Items'][0]['id']['S']
            except Exception as e:
                return respond({'message': 'No group found', 'status': 404})
                
            out = {'group_id': group_id, 'group_name': group}
            
            if len(members) > 0:
                out['members'] = members
                
            if response:
                return respond(None, out)
                
        elif operation in ['POST', 'PUT']:
            items = json.loads(event['body'])
            new_id = uuid.uuid4()
            payload = {
                'TableName': table,
                'Item': {
                    'id': {'S': str(new_id)},
                    'name': {'S': items['name']},
                    'creator': {'S': items['creator']},
                    'created': {'N': str(int(time.time()))}
                }
            }
            response = operations[operation](dynamo, payload)
            if response:
                return respond(None, {'group_id': str(new_id)})
        else:
            return respond({'message': 'Unsupported method "{}"'.format(operation), 'status': 400})
        
        #return respond(None, json.dumps(payload, indent=2))
        #payload = event['queryStringParameters'] if operation == 'GET' else json.loads(event['body'])
        return respond(None, operations[operation](dynamo, payload))
    else:
        return respond({'message': 'Unsupported method "{}"'.format(operation), 'status': 400})
