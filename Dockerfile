# Use an official Node.js runtime as a parent image
FROM node:15

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy the package.json and package-lock.json files
COPY package*.json ./

# Install the dependencies
RUN npm install

# Copy the rest of your app's source code
COPY . .

# Expose the port that the app will run on
EXPOSE 3000

# Define the command to run your app
CMD ["sh", "-c", "node sql/createSchema.js && node bin/www"]
