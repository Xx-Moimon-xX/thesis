#!/bin/bash

# This script retrieves AWS credentials using a Python helper script
# and updates the local.env file. It is designed for use with AWS SSO.

# Get the absolute path of the directory where the script is located
SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

# Check if Python virtual environment exists
if [ ! -f "$SCRIPT_DIR/.venv/bin/python" ]; then
    echo "Python virtual environment not found in $SCRIPT_DIR/.venv. Please run:"
    echo "python3 -m venv .venv"
    echo "./.venv/bin/pip install boto3"
    exit 1
fi

# Check if jq is installed
if ! command -v jq &> /dev/null
then
    echo "jq could not be found. Please install it to use this script."
    echo "On macOS, you can run: brew install jq"
    exit 1
fi

echo "Retrieving AWS credentials from your configured profile via Python..."

# Use the Python script to get credentials
CREDS_JSON=$("$SCRIPT_DIR/.venv/bin/python" "$SCRIPT_DIR/get_aws_creds.py")

if [ $? -ne 0 ]; then
    echo "Error running Python script to get AWS credentials."
    echo "Output was:"
    echo "$CREDS_JSON"
    exit 1
fi

if [ -z "$CREDS_JSON" ]; then
    echo "Python script did not return any credentials. Please ensure you have run 'aws sso login'."
    exit 1
fi

# Extract credentials from the JSON response using jq
AWS_ACCESS_KEY_ID=$(echo "$CREDS_JSON" | jq -r .AWS_ACCESS_KEY_ID)
AWS_SECRET_ACCESS_KEY=$(echo "$CREDS_JSON" | jq -r .AWS_SECRET_ACCESS_KEY)
AWS_SESSION_TOKEN=$(echo "$CREDS_JSON" | jq -r .AWS_SESSION_TOKEN)
AWS_REGION=$(echo "$CREDS_JSON" | jq -r .AWS_REGION)

if [ -z "$AWS_ACCESS_KEY_ID" ] || [ "$AWS_ACCESS_KEY_ID" == "null" ]; then
    echo "Failed to parse AWS credentials from Python script response."
    echo "Response was: $CREDS_JSON"
    exit 1
fi

echo "Successfully retrieved AWS credentials."

ENV_FILE="$SCRIPT_DIR/external/MCPBench/local.env"
ENV_FILE_BACKUP="${ENV_FILE}.bak"

if [ ! -f "$ENV_FILE" ]; then
    echo "Error: $ENV_FILE not found."
    exit 1
fi

# Create a backup of the original file
cp "$ENV_FILE" "$ENV_FILE_BACKUP"

# Create a temporary file for the new content
TMP_FILE=$(mktemp)

# Remove old AWS credential lines from the env file, preserving other variables
grep -v "^AWS_ACCESS_KEY_ID=" "$ENV_FILE" | \
grep -v "^AWS_SECRET_ACCESS_KEY=" | \
grep -v "^AWS_SESSION_TOKEN=" | \
grep -v "^AWS_REGION=" > "$TMP_FILE"

# Add a newline at the end of the temp file if it doesn't have one
if [[ -n "$(tail -c1 "$TMP_FILE")" ]]; then
    echo "" >> "$TMP_FILE"
fi

# Append the new credentials to the temporary file
echo "" >> "$TMP_FILE"
echo "AWS_REGION=${AWS_REGION:-ap-southeast-2}" >> "$TMP_FILE"
echo "AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID" >> "$TMP_FILE"
echo "AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY" >> "$TMP_FILE"
echo "AWS_SESSION_TOKEN=$AWS_SESSION_TOKEN" >> "$TMP_FILE"

# Replace the old env file with the updated one
mv "$TMP_FILE" "$ENV_FILE"

echo "Updated AWS credentials in $ENV_FILE"
echo "A backup of the original file is at $ENV_FILE_BACKUP"
echo ""
echo "To use these credentials in your current shell, you can now run:"
echo "source $ENV_FILE"
echo "and the AWS variables will be exported to your environment." 