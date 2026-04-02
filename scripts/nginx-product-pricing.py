import sys
block = """
    # API proxy — Product Pricing
    location /api/product-pricing/ {
        rewrite ^/api/product-pricing/(.*)$ /$1 break;
        proxy_pass http://127.0.0.1:3125;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
        client_max_body_size 10m;
    }
"""
target = sys.argv[1] if len(sys.argv) > 1 else "/etc/nginx/sites-enabled/zorbit.scalatics.com"
content = open(target).read()
if "location /api/product-pricing/" not in content:
    marker = "# SPA fallback"
    content = content.replace(marker, block + "\n    " + marker)
    open(target, "w").write(content)
    print("OK: product-pricing proxy added")
else:
    print("SKIP: already present")
