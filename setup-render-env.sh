#!/bin/bash

echo "🔥 Настройка переменных окружения на Render..."

# Переменные Firebase
FIREBASE_PROJECT_ID="taska-4fee2"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-fbsvc@taska-4fee2.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCtvHFHXWGHEeLf\nJVVeDNtXxqt1UA9+n3RonlMtWgd4VU+DVDZXshH1NjzwmgnZQTGPnp501PbUS2O3\n67N81umvmUUBcVXAJb048LaSoo3O14vL+PADu/Dh7xU+ZeFSB8oJY6IYbr4ClG2s\na2kLz34hNIBAKdOvsUniQxOVfopsrfKe+6C3cLyR2lO5V+DKnwntyjFGMo7bsNsI\nh3vyE0Ejgn/sALLzpT02VJ/NdSm5JT8mTJcIzm8o1oDTfUWIfW7ERlIsx+c8ISfo\nivfk722UPPmxSRQh/6uapzFI2hHjdcXB25GjgB8fI8pQ2cAMtjazozgAq2GgLQjS\nJSyKdQyPAgMBAAECggEAAibq/O01S2zp7J0NJC3wYTARb6KRnAoGBW4mhWXsTLZW\nBc3L+XlFTSX2bB98V1LmkP8suqrNtL9HymfaRzT2gOjbAs6d2OHHNkGPKc9MLwO5\nIAA1ZK4G3qqhlV2MBIjyexcVD/vIcvWgWK4x0XBD5m+ADD3xqA+vLtDVC5XZ5Hf6\nfZ5Pd8699yviJi35j8ehooFZuvgGJILuR8BSy4JKed5gBpUy60SLK2cd/tofqlzQ\nDfYPdriyrRYrkaQz6WVm6m8KF82dl9uqauWnFsZC7/lPgARvGn/yZYFF4CvgBum4\nGoKq8gJUYNQQnj2oQ4xF2SRNnlNa7NzOTig3iWGsAQKBgQDwcbdg8Ax4dbCM0xAP\nWb185zh7YB2cBw/6BAWyR2Bl5XFz/s5HzYv2nilJGzUw3QNLhOeUOHnrX+n68+ij\nOJfrRbAQSdc2mZWjouaIexd0huyzlBf5i5jp4LKkPS7O0P9uLY3KhKD8h9uGljje\nwQZL+1orqMMi+c9LNxlPcs582QKBgQC4+eTFBQjzo64CAAAy0BtDMKYEmmAEY0tI\n72/bLiP04pQIxQsKVnek4poI3Rmq9rysx9TTwyJIEY2k3tsdfhaLP11T6UXTjl0f\nagB9SXvykjbyLTZtP1Thd7xhkcGBqWnnxcDnXzMpj9byAYu1XRx9MeW4qNyQX63e\ny7YmrfmTpwKBgGV62Takmd7NbTJCcmjIK11oCUKpElYj9O5EfFL+JQVcjUGzrURI\n0GXJ4wrj3NM+tIFPGp5IJ8zbslkkUG9zF0tJIkH9qEN3Ftz1h+7aZM/dklFIk8XS\n0TsEhuEioXrQYr4Ro+Jxj7CFdnWbOW1qcknnT+tVUuaUIJVSL/CEN/ohAoGARY3Z\noufQxORgMupTKMgt6Cbr1kFCJ4Q6s9MsyUrhRFzKcz28eAepd3uplfmlhC7BJWsC\nsRnn0xeenkcaN03JJlUOP9YwZmtawsw2IOY30C+Ar7GmjI/K1/kRAdMv4xST+Q3Y\nCmg2scMffOJt6SV45+6SRcxhG3yOwX7yIDs85HMCgYAoLS+qFeWWunmHKzhok9DK\nls4YCOsi4IVGOlZJSLkt6KqEqQaMKvfdfzndOxkZZyjetUdl1UWWfGkeB5uevZYS\nplIOfmICW69w9VtZuwyLsush6vVLrNdDJpsr7kJkLz1hSZy0UUmP9D66iEnZ+red\niTnY9FAZAZDqn8OMLLmRzw==\n-----END PRIVATE KEY-----"

echo "📋 Переменные для настройки на Render:"
echo ""
echo "NODE_ENV=production"
echo "PORT=10000"
echo "FIREBASE_PROJECT_ID=$FIREBASE_PROJECT_ID"
echo "FIREBASE_CLIENT_EMAIL=$FIREBASE_CLIENT_EMAIL"
echo "FIREBASE_PRIVATE_KEY=$FIREBASE_PRIVATE_KEY"
echo ""
echo "🔗 Перейдите на https://dashboard.render.com/"
echo "1. Найдите сервис 'dddf-1'"
echo "2. Перейдите в Environment"
echo "3. Добавьте переменные выше"
echo "4. Нажмите Save Changes"
echo ""
echo "✅ После настройки проверьте:"
echo "- https://dddf-1.onrender.com/api/firebase-test"
echo "- https://dddf-team-management.netlify.app/debug.html" 