#!/bin/bash


FULL_RELEASE=$(hg branch | xargs hg log -l1 --template '{branch}.{rev} [{latesttag}] - {date|isodate}' -b)
echo $FULL_RELEASE
RELEASE=$(hg branch | xargs hg log -l1 --template '{branch}.{rev}' -b)
SHORT_RELEASE=$(hg branch | xargs hg log -l1 --template '{branch}' -b)

ARCHIVE_NAME=domoweb-temp
ARCHIVE=/tmp/$ARCHIVE_NAME.tgz
POST_PROCESSING=/tmp/domoweb-post-$$
FINAL_ARCHIVE=/tmp/domoweb-$SHORT_RELEASE.tgz


function generate_pkg() {
    echo "Generate package..."
    hg archive \
    -p domoweb-$SHORT_RELEASE \
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
    FILE=$POST_PROCESSING/domoweb-$SHORT_RELEASE/install.sh
    sed -i "s/^.*Which install mode do you want.*$/MODE=install/" $FILE
    if [ $? -ne 0 ] ; then
        echo "Error... exiting"
        exit 1
    fi
    echo "install.sh updated : force install mode"
}

function set_release_number() {
    FILE=$POST_PROCESSING/domoweb-$SHORT_RELEASE/setup.py
    sed -i "s/version = '.*',/version = '"$SHORT_RELEASE"',/" $FILE
    if [ $? -ne 0 ] ; then
        echo "Error... exiting"
        exit 1
    fi
    echo "setup.py : release number updated"
    FILE2=$POST_PROCESSING/domoweb-$SHORT_RELEASE/src/domoweb/settings_base.py
    sed -i "s/DOMOWEB_FULL_VERSION = .*/DOMOWEB_FULL_VERSION = '$FULL_RELEASE'/" $FILE2
    if [ $? -ne 0 ] ; then
        echo "Error... exiting"
        exit 1
    fi
    sed -i "s/DOMOWEB_VERSION = .*/DOMOWEB_VERSION = '$RELEASE'/" $FILE2
    if [ $? -ne 0 ] ; then
        echo "Error... exiting"
        exit 1
    fi
    echo "setting_base.py : release number updated"
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
#clean
