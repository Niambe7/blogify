const AWS = require("aws-sdk");
const cognito = new AWS.CognitoIdentityServiceProvider();

const CLIENT_ID = "70365oucgois2g1ovaj8dr5vi5";

exports.signup = async (event) => {
  const { email, password } = JSON.parse(event.body);

  await cognito
    .signUp({
      ClientId: CLIENT_ID,
      Username: email,
      Password: password
    })
    .promise();

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Code envoyé par email" })
  };
};

exports.confirm = async (event) => {
  const { email, code } = JSON.parse(event.body);

  await cognito
    .confirmSignUp({
      ClientId: CLIENT_ID,
      Username: email,
      ConfirmationCode: code
    })
    .promise();

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Compte confirmé !" })
  };
};

exports.login = async (event) => {
  const { email, password } = JSON.parse(event.body);

  const response = await cognito
    .initiateAuth({
      AuthFlow: "USER_PASSWORD_AUTH",
      ClientId: CLIENT_ID,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password
      }
    })
    .promise();

  return {
    statusCode: 200,
    body: JSON.stringify(response.AuthenticationResult)
  };
};
