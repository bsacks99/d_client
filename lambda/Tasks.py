
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
    
    table = 'Tasks'

    operations = {
    #    'DELETE': lambda dynamo, x: dynamo.delete_item(**x),
        'GET': lambda dynamo, x: dynamo.scan(**x),
        'POST': lambda dynamo, x: dynamo.put_item(**x),
        'PUT': lambda dynamo, x: dynamo.update_item(**x),
        'PATCH': lambda dynamo, x: dynamo.update_item(**x),
    }

    operation = event['httpMethod']
    if operation in operations:
        payload = None
        if operation == 'GET':

            qs = event['queryStringParameters']
            
            dynamodb = boto3.resource('dynamodb')
            working_table = dynamodb.Table(table)

            task_id = None
            group_id = None
            name = None
 
            try:
                task_id = qs['task_id']
            except:
                pass
            
            try:
                group_id = qs['group_id']
            except:
                pass
            try:
                creator = qs['creator']
            except:
                pass
            
            if (group_id is None or group_id == 'undefined') and (creator is None or creator == 'undefined') and (task_id is None or task_id == 'undefined'):
                return respond({'message': 'Invalid arguements', 'status': 400})
                
            filter = Attr('done').eq('no')
            
            if group_id is not None and group_id != 'undefined':
                filter = filter & Attr('group_id').eq(qs['group_id'])
                
            if creator is not None and creator != 'undefined':
                filter = filter & Attr('creator').eq(qs['creator'])
                
            if task_id is not None and task_id != 'undefined':
                filter = filter & Attr('id').eq(qs['task_id'])
                    
            response = working_table.scan(  
                FilterExpression=filter
            )

            if not response:
                return respond({'message': 'No tasks found', 'status': 404})
                
            out = []
            
            for item in response['Items']:

                try:
                    task_id = item['id']
                    name = item['name']
                    reoccuring = item['reoccuring']
                    creator = item['creator']
                    created = int(item['created'])
                    last_done = int(item['last_done'])
                except Exception as e:
                    return respond({'message': e, 'status': 500})
                
                out.append({'task_id': task_id, 'name': name, 'reoccuring': reoccuring, 'creator': creator, 'created': created, 'last_done': last_done})
                
            return respond(None, out)
                
        elif operation in ['POST']:
            items = json.loads(event['body'])
            new_id = uuid.uuid4()
      
            group_id = 'none'
            try:
                if items['group_id'] != '':
                    group_id = items['group_id']
            except:
                pass
            
            reoccuring = 'no'
            try:
                reoccuring = items['reoccuring']
            except:
                pass
            
            done = 'no'
            try:
                done = items['done']
            except:
                pass
            
            payload = {
                'TableName': table,
                'Item': {
                    'id': {'S': str(new_id)},
                    'group_id': {'S': group_id},
                    'name': {'S': items['name']},
                    'reoccuring': {'S': reoccuring},
                    'done': {'S': done},
                    'creator': {'S': items['creator']},
                    'created': {'N': str(int(time.time()))},
                    'last_done': {'N': str(0)},
                }
            }
            response = operations[operation](dynamo, payload)
            if response:
                return respond(None, {'task_id': str(new_id)})
        elif operation in ['PATCH']:
            items = json.loads(event['body'])
            qs = event['queryStringParameters']
            
            dynamodb = boto3.resource('dynamodb')
            working_table = dynamodb.Table(table)
            
            check_result = working_table.scan(  
                FilterExpression=Attr('id').eq(items['task_id'])
            )
            if not check_result:
                return respond({'message': 'No task found', 'status': 404})
                
            payload = {
                'TableName': table,
                'Key': {'id': {'S': items['task_id']}},
                "UpdateExpression" : "SET #attrName =:attrValue",
                "ExpressionAttributeNames" : {
                    "#attrName" : "last_done"
                },
                "ExpressionAttributeValues" : {
                    ":attrValue" : {
                        'N': str(int(time.time()))
                    }
                },
                'ReturnValues': "UPDATED_OLD"
            }
            response = operations[operation](dynamo, payload)
            
            if check_result['Items'][0]['reoccuring'] == 'no':
                payload = {
                    'TableName': table,
                    'Key': {'id': {'S': items['task_id']}},
                    "UpdateExpression" : "SET #attrName =:attrValue",
                    "ExpressionAttributeNames" : {
                        "#attrName" : "done"
                    },
                    "ExpressionAttributeValues" : {
                        ":attrValue" : {
                            'S': 'yes'
                        }
                    },
                    'ReturnValues': "UPDATED_OLD"
                }
                response = operations[operation](dynamo, payload)
                
            response = operations[operation](dynamo, payload)
            
            try:
                new_id = uuid.uuid4()
                history = {
                    'TableName': 'History',
                    'Item': {
                        'id': {'S': str(new_id)},
                        'task_id': {'S': items['task_id']},
                        'name': {'S': check_result['Items'][0]['name']},
                        'group_id': {'S': check_result['Items'][0]['group_id']},
                        'doer': {'S': items['doer']},
                        'done': {'N': str(int(time.time()))}
                    }
                }
                operations['POST'](dynamo, history)
            except Exception as e:
                #return respond({'message': e, 'status': 500})
                pass
            
            if response:
                return respond(None, {'task_id': items['task_id']}) 
            else:
                return respond({'message': 'No tasks found', 'status': 404})
        else:
            return respond({'message': 'Unsupported method "{}"'.format(operation), 'status': 400})
    else:
        return respond({'message': 'Unsupported method "{}"'.format(operation), 'status': 400})
