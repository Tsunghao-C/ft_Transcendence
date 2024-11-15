# ft_Transcendence
Developing a web game Pong from scratch


# Pong Game Project

## Quick Start

1. Clone the repository
```bash
git clone <repository-url>
cd ft_Transcendence/pong-game
```

2. Set up environment
```bash
cp .env.example .env
# Edit .env with appropriate values
```

3. Start services
```bash
docker-compose up -d
```

## Development Access Points

- Frontend (SPA): http://localhost
- Auth Service: http://localhost:8001
- User Service: http://localhost:8002
- Game Service: http://localhost:8004
- Vault UI: http://localhost:8200
- Grafana: http://localhost:3001
- Kibana: http://localhost:5601
- Prometheus: http://localhost:9090

## Team Development Guidelines

### Auth Team
- Work in `auth-service/` directory
- Database migrations in `auth-service/src/migrations/`
- Access service at http://localhost:8001

### User Management Team
- Work in `user-service/` directory
- Database migrations in `user-service/src/migrations/`
- Access service at http://localhost:8002

### Game Team
- Work in `game-service/` directory
- Database migrations in `game-service/src/migrations/`
- Access service at http://localhost:8004

### Frontend Team
- Work in `frontend/` directory
- Access development server at http://localhost:3000

### Monitoring Team
- Configure Prometheus in `monitoring/prometheus/`
- Set up Grafana dashboards in `monitoring/grafana/`
- Configure ELK stack in `monitoring/elk/`