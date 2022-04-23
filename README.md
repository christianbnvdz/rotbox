# Setup

These environment variables must be set in order for the api to work:

- FILE_STORAGE_DIR (where files will be uploaded to)
- STATIC_FILES_DIR (the front end web app)
- MONGODB_URL (url for the mongodb instance)
- PORT (port number for this app to listen on)
- JWT_MAX_AGE (max age of JWTs issued by the app)
- HOST_URL (the url for this host)
- PRIVATE_KEY (RS256, for encrypting JWTs)
- PUBLIC_KEY (RS256, for decrypting JWTs)

Use absolute paths for directories. Directories must already exist.
