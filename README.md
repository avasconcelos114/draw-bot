# Draw Bot

## Running on Docker
REQUIRED TO RUN SEPARATE MONGODB CONTAINER:
```
docker run -d -p 27017:27017 -e MONGO_INITDB_ROOT_USERNAME="root" -e MONGO_INITDB_ROOT_PASSWORD="example" --name draw-mongo mongo:latest
```

```
docker build -t registry.architectgroup.com/draw-bot:2.0 . 
```

Fingerchat
```
docker run --name draw-bot -v $PWD:/home/app -e TZ=${TZ} -e PORT=3001 -e MATTERMOST_SERVER="https://chat.architectgroup.com" -e TOKEN="sd67j1cxepnc7meo3prf3krzgr" -e MONGO_USERNAME="root" -e MONGO_PASSWORD="example" -e MONGO_SERVER="192.168.1.164:27017" registry.architectgroup.com/draw-bot:2.0
```

Localhost
```
docker run -p 3001:3001 --name draw-bot -v $PWD:/home/app -e TZ=${TZ} -e PORT=3001 -e MATTERMOST_SERVER="http://192.168.1.164:8065" -e TOKEN="s1kikak8a78qi81kij53xizpew" -e MONGO_USERNAME="root" -e MONGO_PASSWORD="example" -e MONGO_SERVER="192.168.1.164:27017" registry.architectgroup.com/draw-bot:2.0
```