#!/bin/sh
# Applies pending migrations, then starts the application.
#
# Migrations run here rather than in the build so that an image can be promoted
# between environments without being rebuilt. A failure stops the container:
# serving an application against a schema it does not expect is worse than not
# starting.
set -e

echo "Applying database migrations..."
./node_modules/.bin/prisma migrate deploy

echo "Starting Profolio..."
exec "$@"
