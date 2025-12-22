#!/bin/bash
cd ~/livekit

# Generate API secret
SECRET=$(openssl rand -base64 32 | tr -d '\n')
echo "Generated API secret: $SECRET"

# Create livekit.yaml with the secret
cat > livekit.yaml << EOF
port: 7880
rtc:
  port_range_start: 50000
  port_range_end: 60000
  tcp_port: 7881
  use_external_ip: true
keys:
  APIodispear: $SECRET
turn:
  enabled: true
  domain: livekit.n0tmot.com
  tls_port: 5349
  udp_port: 3478
logging:
  level: info
EOF

# Create docker-compose.yaml
cat > docker-compose.yaml << 'EOF'
services:
  livekit:
    image: livekit/livekit-server:latest
    command: --config /livekit.yaml
    restart: unless-stopped
    network_mode: host
    volumes:
      - ./livekit.yaml:/livekit.yaml

  caddy:
    image: livekit/caddyl4:latest
    restart: unless-stopped
    network_mode: host
    volumes:
      - ./caddy.yaml:/caddy.yaml
      - caddy_data:/data
    command: run --config /caddy.yaml --adapter yaml

volumes:
  caddy_data:
EOF

# Create caddy.yaml for SSL
cat > caddy.yaml << 'EOF'
logging:
  logs:
    default:
      level: INFO

apps:
  layer4:
    servers:
      main:
        listen:
          - ":443"
        routes:
          - match:
              - tls:
                  sni:
                    - "livekit.n0tmot.com"
            handle:
              - handler: tls
              - handler: proxy
                upstreams:
                  - dial:
                      - "localhost:7880"
          - match:
              - tls:
                  sni:
                    - "turn.n0tmot.com"
            handle:
              - handler: tls
              - handler: proxy
                upstreams:
                  - dial:
                      - "localhost:5349"

  tls:
    certificates:
      automate:
        - "livekit.n0tmot.com"
        - "turn.n0tmot.com"
EOF

echo "Configuration files created successfully!"
echo ""
echo "livekit.yaml:"
cat livekit.yaml
echo ""
echo "API Key: APIodispear"
echo "API Secret: $SECRET"
echo ""
echo "Save these credentials - you'll need them for the backend!"
