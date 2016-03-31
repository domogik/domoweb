# This script will generate a self signed SSL certificate which will be valid for 2 years.
# The certificate will have no passphrase

DIR=$(dirname $0)
echo "----------------------------------------------------------"
echo "Generating the certificate and key !"
echo "----------------------------------------------------------"
echo ""
echo "Certificates will be generated in the folder '$DIR'"
openssl req -x509 -newkey rsa:2048 -keyout $DIR/ssl_key.pem -out $DIR/ssl_cert.pem -days 730 -nodes << EOF
FR
Domogik state
Domogik city
Domogik inc
.
.
.
.
EOF

if [[ ! -f $DIR/ssl_key.pem || ! -f $DIR/ssl_cert.pem ]] ; then
    echo "[ ERROR ] An error occured, please check the lines before!"
    exit 1
fi

echo ""
echo "[  OK  ] SSL certificate and key created. "
echo ""
echo ""
echo "----------------------------------------------------------"
echo "Setting domoweb configuration..."
echo "----------------------------------------------------------"
echo ""
sed -i "s/^use_ssl.*/use_ssl = True/" /etc/domoweb.cfg
if [[ $? -ne 0 ]] ; then
    echo "[ ERROR ] An error occured, please check the lines before!"
    exit 2
fi
echo "[  OK  ] Configuration file updated!"
echo ""
echo "----------------------------------------------------------"
echo "==>        All is OK, please restart Domoweb!          <=="
echo "----------------------------------------------------------"

