import sys
conf = """
    # Demo videos — served from separate directory (NEVER affected by admin-console deployments)
    location /demos/ {
        alias /home/sourav/apps/zorbit-platform/demos/;
        expires 30d;
        add_header Cache-Control "public, immutable";
        add_header Access-Control-Allow-Origin "*";
    }
"""
target = sys.argv[1] if len(sys.argv) > 1 else "/etc/nginx/sites-enabled/zorbit.scalatics.com"
content = open(target).read()
marker = "# SPA fallback"
if "alias /home/sourav/apps/zorbit-platform/demos/" not in content:
    content = content.replace(marker, conf + "\n    " + marker)
    open(target, "w").write(content)
    print("OK: /demos/ location added pointing to separate demos directory")
else:
    print("SKIP: already present")
