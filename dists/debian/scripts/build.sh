#!/bin/bash -e

. ../libmake.sh

[ ! -z $1 ] && [ "$1" == "auto" ] && [ $(continue_auto_mode) == "n" ] && echo "Mode auto enabled but not on master architecture ... exiting ..." && exit 0

VERSION=$DMWVERSION

PKGPARAMS=""

cd upstream/domoweb
TARFILE=$(./package.sh $PKGPARAMS | grep "Final package generated :" | cut -d":" -f2)
cd ../..

echo $TARFILE

mv $TARFILE .
PKGVERSION=$(echo $TARFILE | cut -d"-" -f2- | sed -e "s/.tgz//")

HGVERSION=$VERSION-`date "+%Y%m%d%H%M"`-$PKGVERSION-a

[ $(continue_update $HGVERSION ) == "n" ] && echo "domoweb : Package already uploaded ... skip building ..." && exit 0


tar xvzf domoweb-$PKGVERSION.tgz

rm -Rf domoweb-$VERSION
rm -Rf domoweb-$VERSION.orig
clean_build_directory

mv domoweb-$PKGVERSION domoweb-$VERSION
cp -Rf domoweb-$VERSION domoweb-$VERSION.orig
cp -Rf debian domoweb-$VERSION

cd domoweb-$VERSION

#Update changelog
OLDLANG=$LANG
FULLDATE=`export LANG="" && date "+%a, %d %b %Y %X %z"`
export LANG=$OLDLANG
cd debian
mv changelog changelog.old
mv changelog.template changelog
cat changelog.old >> changelog
sed -i -e "s/_VERSION_/$HGVERSION/" changelog
sed -i -e "s/_FULLDATE_/$FULLDATE/" changelog
cd ..
cp src/examples/init/domoweb domoweb.init
cp src/examples/default/domoweb domoweb.default
cd ..
#cp -Rf domoweb-$VERSION domoweb-$VERSION.orig

cd domoweb-$VERSION

for patch in `find debian/patches/*`
do
    patch -p1 < $patch
done

dpkg-buildpackage -rfakeroot $DPKGOPTS

RET=$?
#RET=1
echo ret=$RET

if [[ $RET == 0 ]]
then
    cd ..
     dupload *.changes
    #../reprepro_addchanges.sh \*.changes
    rm *.deb
    rm *.changes
    rm *.dsc
    rm domoweb*.tar.gz
    rm domoweb*.tgz
    rm -Rf domoweb-$VERSION
fi
