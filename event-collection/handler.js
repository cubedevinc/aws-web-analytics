const AWS = require('aws-sdk');
const { promisify } = require('util');

const kinesis = new AWS.Kinesis();

const putRecord = promisify(kinesis.putRecord.bind(kinesis));

const response = (body, status) => {
  return {
    statusCode: status || 200,
    body: body && JSON.stringify(body),
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
      'Content-Type': 'application/json'
    }
  }
}

module.exports.collect = async (event, context) => {
  const body = JSON.parse(event.body);
  if (!body.anonymousId || !body.url || !body.eventType) {
    return response({
      error: 'anonymousId, url and eventType required'
    }, 400);
  }

  await putRecord({
    Data: JSON.stringify({
      ...body,
      timestamp: (new Date()).toISOString(),
      sourceIp: event.requestContext.identity.sourceIp,
      userAgent: event.requestContext.identity.userAgent
    }) + '\n',
    PartitionKey: body.anonymousId,
    StreamName: 'event-collection'
  });

  return response();
};
