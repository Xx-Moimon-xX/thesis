#!/usr/bin/env python3
"""
Script to launch MCP servers using Docker Compose with supergateway.
This replaces the bash script that uses npx supergateway directly.
"""

import json
import os
import sys
import subprocess
from pathlib import Path

def load_config(config_path):
    """Load and parse the MCP configuration file."""
    if not config_path.startswith('/'):
        config_path = f"external/MCPBench/configs/{config_path}"
    
    if not os.path.exists(config_path):
        print(f"Config file '{config_path}' does not exist.")
        sys.exit(1)
    
    with open(config_path, 'r') as f:
        return json.load(f)

def generate_docker_compose(config, project_root, env_vars=None):
    """Generate docker-compose.yml content from MCP config."""
    compose_lines = ["services:"]
    service_count = 0
    
    for server in config['mcp_pool']:
        name = server['name']
        
        # Skip servers with URLs (external services)
        if 'url' in server:
            print(f"Server '{name}' is configured with URL: {server['url']}, skipping Docker setup.")
            continue
        
        run_config = server['run_config'][0]  # Assume first run_config
        command = run_config['command']
        args = run_config.get('args', [])
        # --- NEW: If command is 'docker', just run the docker command directly ---
        if command == 'docker':
            docker_cmd = ['docker'] + args
            print(f"Running: {' '.join(docker_cmd)}")
            try:
                subprocess.run(docker_cmd, check=True)
            except subprocess.CalledProcessError as e:
                print(f"Failed to run docker command: {e}")
                sys.exit(1)
            continue

        port = run_config['port']
        docker_image = run_config.get('docker_image', 'supercorp/supergateway:latest')

        # --- Automation: If using a custom Docker image (e.g., Python/Atlassian), do not mount project root or override command ---
        # Heuristic: If docker_image is not supercorp/supergateway:latest, treat as custom image
        use_custom_image = docker_image != 'supercorp/supergateway:latest'

        service_name = f"mcp-{name}"
        compose_lines.append(f"  {service_name}:")
        compose_lines.append(f"    image: {docker_image}")
        compose_lines.append(f"    container_name: {service_name}")
        compose_lines.append(f"    ports:")
        compose_lines.append(f"      - \"{port}:{port}\"")

        if not use_custom_image:
            # Node/JS services: mount project root and override command
            compose_lines.append(f"    volumes:")
            compose_lines.append(f"      - \"{project_root}:/workspace\"")
            compose_lines.append(f"    working_dir: /workspace")
            # Handle command path - convert absolute paths to relative from project root
            if command.startswith('/Users/'):
                if '/cxnpl/thesis/' in command:
                    command = command.split('/cxnpl/thesis/')[-1]
                else:
                    command = 'node'  # fallback to node
            # Handle args - convert absolute paths to relative
            converted_args = []
            for arg in args:
                if isinstance(arg, str) and arg.startswith('/Users/'):
                    if '/cxnpl/thesis/' in arg:
                        converted_args.append(arg.split('/cxnpl/thesis/')[-1])
                    else:
                        converted_args.append(arg)
                else:
                    converted_args.append(str(arg))
            full_command = f"{command} {' '.join(converted_args)}"
            compose_lines.append(f"    command:")
            compose_lines.append(f"      - --stdio")
            compose_lines.append(f"      - \"{full_command}\"")
            compose_lines.append(f"      - --port")
            compose_lines.append(f"      - \"{port}\"")
            compose_lines.append(f"      - --baseUrl")
            compose_lines.append(f"      - \"http://localhost:{port}\"")
            compose_lines.append(f"      - --ssePath")
            compose_lines.append(f"      - /sse")
            compose_lines.append(f"      - --messagePath")
            compose_lines.append(f"      - /message")
            compose_lines.append(f"      - --name")
            compose_lines.append(f"      - \"{server.get('tools', [{}])[0].get('tool_name', name) if server.get('tools') else name}\"")
            compose_lines.append(f"      - --keyword")
            compose_lines.append(f"      - \"\"")
            compose_lines.append(f"    restart: unless-stopped")
            # Merge environment variables: env_vars first, then run_config['env'] (which overrides)
            merged_env = dict(env_vars) if env_vars else {}
            if 'env' in run_config:
                merged_env.update(run_config['env'])
            if merged_env:
                compose_lines.append(f"    environment:")
                for key, value in merged_env.items():
                    compose_lines.append(f"      {key}: \"{value}\"")
        else:
            # Custom image (e.g., Python/Atlassian): do not mount project root, do not override command
            compose_lines.append(f"    restart: unless-stopped")
            compose_lines.append(f"    environment:")
        service_count += 1
    return '\n'.join(compose_lines), service_count

def main():
    if len(sys.argv) != 2:
        print("Usage: python3 launch_mcp_servers_docker.py <config_file_path>")
        sys.exit(1)
    
    config_file = sys.argv[1]
    # Set project_root to the thesis directory (now the current directory)
    project_root = os.path.abspath(os.path.dirname(__file__))
    
    # Load local.env if it exists  
    env_vars = {}
    local_env_paths = [
        os.path.join(project_root, 'local.env'),
        os.path.join(project_root, 'external', 'MCPBench', 'local.env')
    ]
    for env_file in local_env_paths:
        if os.path.exists(env_file):
            print(f"Loading environment from {env_file}")
            with open(env_file, 'r') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#') and '=' in line:
                        key, value = line.split('=', 1)
                        env_vars[key.strip()] = value.strip()
            break
    print(f"Loaded env_vars: {env_vars}")
    
    # Load configuration
    config = load_config(config_file)
    
    if not config['mcp_pool']:
        print("No servers defined in mcp_pool.")
        sys.exit(1)
    
    # Generate docker-compose.yml
    compose_content, service_count = generate_docker_compose(config, project_root, env_vars)
    
    if service_count == 0:
        print("No Docker services to create (all servers may be using external URLs).")
        sys.exit(0)
    
    # Write docker-compose.yml
    compose_file = os.path.join(project_root, 'docker-compose.mcp.yml')
    with open(compose_file, 'w') as f:
        f.write(compose_content)
    
    print(f"Generated {compose_file}")
    print(f"Starting {service_count} MCP servers...")
    
    # Start the services
    try:
        subprocess.run([
            'docker-compose', '-f', compose_file, 'up', '-d'
        ], check=True)
        
        print("MCP servers started successfully!")
        print("Services running:")
        
        # Extract port info from config for display
        for server in config['mcp_pool']:
            if 'url' not in server:
                name = server['name']
                port = server['run_config'][0]['port']
                print(f"  - mcp-{name}: http://localhost:{port}")
                print(f"    - SSE: http://localhost:{port}/sse")
                print(f"    - Message: http://localhost:{port}/message")
        
        print(f"\nTo stop all services: docker-compose -f {compose_file} down")
        print(f"To view logs: docker-compose -f {compose_file} logs -f")
        
    except subprocess.CalledProcessError as e:
        print(f"Failed to start Docker services: {e}")
        sys.exit(1)
    except FileNotFoundError:
        print("docker-compose not found. Please install Docker Compose.")
        sys.exit(1)

if __name__ == "__main__":
    main()