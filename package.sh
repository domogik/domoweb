#!/bin/bash

BRANCH='0.2.0'
RELEASE='beta2'
REV=$(hg id -n)


VERSION="$BRANCH-$RELEASE.$REV"
echo $VERSION
SHORT_VERSION="$BRANCH-$RELEASE"

ARCHIVE_NAME=domoweb-temp
ARCHIVE=/tmp/$ARCHIVE_NAME.tgz
POST_PROCESSING=/tmp/domoweb-post-$$
FINAL_ARCHIVE=/tmp/domoweb-$SHORT_VERSION.tgz


function generate_pkg() {
    echo "Generate package..."
    hg archive \
    -p domoweb-$SHORT_VERSION \
    -X re:package.*.sh \
    -X .hgignore  \
    -X .hg_archival.txt \
    -X .hgtags \
    -t tgz $ARCHIVE 

    if [ $? -ne 0 ] ; then
        echo "Error... exiting"
        exit 1
    fi
    echo "Package successfully created : $ARCHIVE"
}

function extract() {
    mkdir -p $POST_PROCESSING
    cd $POST_PROCESSING
    tar xzf $ARCHIVE
    if [ $? -ne 0 ] ; then
        echo "Error... exiting"
        exit 1
    fi
    echo "Package extracted in post processing path : $POST_PROCESSING"
}

function force_install_mode() {
    FILE=$POST_PROCESSING/domoweb-$SHORT_VERSION/install.sh
    sed -i "s/^.*Which install mode do you want.*$/MODE=install/" $FILE
    if [ $? -ne 0 ] ; then
        echo "Error... exiting"
        exit 1
    fi
    echo "install.sh updated : force install mode"
}

function set_release_number() {
    FILE=$POST_PROCESSING/domoweb-$SHORT_VERSION/setup.py
    sed -i "s/version = '.*',/version = '"$SHORT_VERSION"',/" $FILE
    if [ $? -ne 0 ] ; then
        echo "Error... exiting"
        exit 1
    fi
    echo "setup.py : release number updated"
    FILE2=$POST_PROCESSING/domoweb-$SHORT_VERSION/generate_revision.py
    sed -i "s/    'rev':.*/    'rev':'$REV',/" $FILE2
    if [ $? -ne 0 ] ; then
        echo "Error... exiting"
        exit 1
    fi
    echo "setup: revision number updated"
}

function create_final_pkg() {
    cd $POST_PROCESSING/
    tar czf $FINAL_ARCHIVE *
    if [ $? -ne 0 ] ; then
        echo "Error... exiting"
        exit 1
    fi
    echo "Final package generated : $FINAL_ARCHIVE"
}


function clean() {
    rm -Rf $POST_PROCESSING
}

### main 
generate_pkg
extract
force_install_mode
set_release_number
create_final_pkg
clean
