
import boto3
import json
import uuid
import time

from boto3.dynamodb.conditions import Key, Attr

print('Loading function')
dynamo = boto3.client('dynamodb')
cognito = boto3.client('cognito-idp')


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

    table = 'GroupInvitations'
    
    operations = {
        'DELETE': lambda dynamo, x: dynamo.delete_item(**x),
        'GET': lambda dynamo, x: dynamo.scan(**x),
        'POST': lambda dynamo, x: dynamo.put_item(**x),
        'PUT': lambda dynamo, x: dynamo.update_item(**x),
    }
    
    operation = event['httpMethod']
    if operation in ['GET']:
            qs = event['queryStringParameters']
            
            dynamodb = boto3.resource('dynamodb')
            working_table = dynamodb.Table(table)
    
            response = working_table.scan(  
                FilterExpression=Attr('member').eq(qs['email']) & Attr('status').eq('pending')
            )
            
            group = None
            
            if not response:
                return respond({'message': 'No group member found', 'status': 404})

            try:
                invitation_id = response['Items'][0]['id']
                group = response['Items'][0]['group_id']
                creator = response['Items'][0]['creator']
            except:
                return respond({'message': 'No group invitation found', 'status': 404})
            
            group_name = ''
            payload = {
                'TableName': 'Groups',
                'ScanFilter': {"id":{"AttributeValueList":[{"S": group}], "ComparisonOperator":"EQ"}}
            }
            response = operations[operation](dynamo, payload)
            try:
                group_name = response['Items'][0]['name']['S']
            except:
                return respond({'message': 'No group found', 'status': 500}) 
                
            if response:
                return respond(None, {'invitation_id': invitation_id, 'group_id': group, 'creator': creator, 'group_name': group_name})
    if operation in ['PUT']:    
        items = json.loads(event['body'])
        qs = event['queryStringParameters']
        
        payload = {
            'TableName': table,
            'Key': {'id': {'S': items['invitation_id']}},
            "UpdateExpression" : "SET #attrName =:attrValue",
            "ExpressionAttributeNames" : {
                "#attrName" : "status"
            },
            "ExpressionAttributeValues" : {
                ":attrValue" : {
                    "S" : items['status']
                }
            },
            'ReturnValues': "UPDATED_OLD"
        }
        response = operations[operation](dynamo, payload)
        if response:
            return respond(None, {'invitation_id': items['invitation_id']}) 
        else:
            return respond({'message': 'No group invitation found', 'status': 404})
    if operation in ['POST']:
        items = json.loads(event['body'])

        # check for pending or accepted invitation
        query = {
            'TableName': table,
            'ScanFilter': {"member":{"AttributeValueList":[{"S": items['member']}], "ComparisonOperator":"EQ"}},
        }
        
        result = dynamo.scan(**query)
        if result:
            try:
                if result['Items'][0]['status']['S'] in ['pending', 'accepted']:
                    return respond({'message': 'User has an existing invitation.', 'status': 409})
            except:
                pass
        # check GroupMembers for existing membership
        query = {
            'TableName': "GroupMembers",
            'ScanFilter': {"member":{"AttributeValueList":[{"S": items['member']}], "ComparisonOperator":"EQ"}},
        }
        
        result = dynamo.scan(**query)
        if result:
            try:
                if result['Items'][0]['member']['S'] == items['member']:
                    return respond({'message': 'User has an existing group membership.', 'status': 409})
            except:
                pass
            
        response = False    
        try:
            response = cognito.admin_get_user(
                UserPoolId='us-east-1_xdOMAneGm',
                Username=items['member']
            )
        except Exception as e:
            return respond({'message': 'User not found', 'status': 404})
        
        if response:
            try:
                if response['UserStatus'] == 'CONFIRMED' and response['Enabled']:
                    new_id = uuid.uuid4()
                    payload = {
                        'TableName': table,
                        'Item': {
                            'id': {'S': str(new_id)},
                            'group_id': {'S': items['group_id']},
                            'creator': {'S': items['creator']},
                            'member': {'S': items['member']},
                            'created': {'N': str(int(time.time()))},
                            'status': {'S': 'pending'}
                        }
                    }
                    response = operations[operation](dynamo, payload)
                    if response:
                        return respond(None, {'invitation_id': str(new_id)})
                else:
                    return respond({'message': 'User not confirmed or enabled', 'status': 409})
            except:
                return respond({'message': 'User not found', 'status': 404})
        else:
            return respond({'message': 'User not found', 'status': 404})
    else:
        return respond({'message': 'Unsupported method "{}"'.format(operation), 'status': 400})
