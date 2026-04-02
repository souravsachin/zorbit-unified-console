import sys
target = sys.argv[1] if len(sys.argv) > 1 else "/etc/nginx/sites-enabled/livestream.scalatics.com"
content = open(target).read()

if "proxy_hide_header WWW-Authenticate" not in content:
    # Add proxy_hide_header after the basic auth line in the /admin block
    content = content.replace(
        'proxy_set_header Authorization "Basic YWRtaW46WjByYjF0LUwxdjMhMjAyNg==";',
        'proxy_set_header Authorization "Basic YWRtaW46WjByYjF0LUwxdjMhMjAyNg==";\n\n        # Suppress Owncast WWW-Authenticate header so browser does not show basic auth popup\n        proxy_hide_header WWW-Authenticate;'
    )
    open(target, "w").write(content)
    print("OK: Added proxy_hide_header WWW-Authenticate to /admin block")
else:
    print("SKIP: Already has proxy_hide_header")
