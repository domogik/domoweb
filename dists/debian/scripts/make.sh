#!/bin/bash

. ../libmake.sh

[ ! -z $1 ] && [ "$1" == "auto" ] && [ $(continue_auto_mode) == "n" ] && echo "Mode auto enabled but not on master architecture ... exiting ..." && exit 0

VERSION=$DMWVERSION

clean_build_directory

#rm -Rf
#mkdir upstream
cd upstream
if [[ -d domoweb ]]
then
    cd domoweb
    hg pull
    hg update 0.2
    cd ..
else
    hg clone http://hg.domogik.org/domoweb/
fi

rm -Rf domoweb-$VERSION
cp -Rf domoweb domoweb-$VERSION
cd domoweb-$VERSION
find . -depth -name ".hg" -exec rm -rf {} \;
find . -depth -name ".hgignore" -exec rm -f {} \;
cd ..

tar czf domoweb_$VERSION.hg.tar.gz domoweb-$VERSION

rm  -Rf domoweb-$VERSION
mv domoweb_$VERSION.hg.tar.gz ../

cd ..

