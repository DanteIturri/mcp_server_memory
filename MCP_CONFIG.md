# Configuración para tu MCP Client
# Copia la configuración de abajo en tu archivo de configuración MCP

"MemoryServer": {
    "command": "npx",
    "args": [
        "-y",
        "tsx",
        "/home/dante/Documentos/mcp_server_memory/src/index.ts"
    ],
    "env": {},
    "type": "stdio"
}

# O alternativamente, usa esta configuración con pnpm para mejor rendimiento:

"MemoryServer": {
    "command": "pnpm",
    "args": [
        "--dir",
        "/home/dante/Documentos/mcp_server_memory",
        "exec",
        "tsx",
        "src/index.ts"
    ],
    "env": {},
    "type": "stdio"
}