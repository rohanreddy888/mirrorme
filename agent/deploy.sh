#!/bin/bash


# Create logs directory
mkdir -p logs

case "$1" in
  "install")
    echo "Installing PM2 globally..."
    pnpm install -g pm2
    echo "PM2 installed!"
    ;;
  "build")
    echo "Building mirrorme-ai-backend..."
    pnpm install
    pnpm run build
    echo "Build complete!"
    ;;
  "start")
    echo "Starting mirrorme-ai-backend with PM2..."
    pm2 start ecosystem.config.cjs --env production 
    pm2 save
    echo "Service started!"
    ;;
  "startup")
    echo "Configuring PM2 to start on boot..."
    pm2 startup
    pm2 save
    echo "PM2 will now start automatically on boot!"
    ;;
  "stop")
    echo "Stopping mirrorme-ai-backend..."
    pm2 stop mirrorme-ai-backend
    echo "Service stopped!"
    ;;
  "restart")
    echo "Restarting mirrorme-ai-backend..."
    pm2 restart mirrorme-ai-backend
    echo "Service restarted!"
    ;;
  "reload")
    echo "Reloading mirrorme-ai-backend (zero-downtime)..."
    pm2 reload mirrorme-ai-backend
    echo "Service reloaded!"
    ;;
  "logs")
    pm2 logs mirrorme-ai-backend
    ;;
  "monitor")
    pm2 monit
    ;;
  "status")
    pm2 status
    ;;
  "update")
    echo "Updating service..."
    git pull
    npm install
    npm run build
    pm2 reload mirrorme-ai-backend
    echo "Update complete!"
    ;;
  "delete")
    echo "Deleting PM2 process..."
    pm2 delete mirrorme-ai-backend
    echo "Process deleted!"
    ;;
  *)
    echo "Usage: $0 {install|build|start|startup|stop|restart|reload|logs|monitor|status|update|delete}"
    echo ""
    echo "Commands:"
    echo "  install  - Install PM2 globally"
    echo "  build    - Build the service"
    echo "  start    - Start the service"
    echo "  startup  - Configure PM2 to start on boot"
    echo "  stop     - Stop the service"
    echo "  restart  - Restart the service"
    echo "  reload   - Zero-downtime reload"
    echo "  logs     - View logs"
    echo "  monitor  - Open PM2 monitoring dashboard"
    echo "  status   - Show service status"
    echo "  update   - Pull latest code and reload"
    echo "  delete   - Remove PM2 process"
    exit 1
    ;;
esac
