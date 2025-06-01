# Use the official Deno image as a base
FROM denoland/deno:latest

# Set the working directory inside the container
WORKDIR /app

# Copy all files from the current directory to the /app directory
COPY main.ts ./

# Cache dependencies
RUN deno cache main.ts

# Command to run the Deno application
CMD ["deno", "run", "-A", "main.ts"]