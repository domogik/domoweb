#!/bin/bash

BRANCH='0.3'
RELEASE='final'
REV=$(git rev-parse HEAD)

VERSION="$BRANCH-$RELEASE.$REV"
echo $VERSION
SHORT_VERSION="$BRANCH-$RELEASE"

ARCHIVE=/tmp/domoweb-$SHORT_VERSION.tgz


function generate_pkg() {
    echo "Generate package..."
    git archive $BRANCH \
    --prefix domoweb-$SHORT_VERSION/ \
    --worktree-attributes \
    --format tgz \
    --output $ARCHIVE \

    if [ $? -ne 0 ] ; then
        echo "Error... exiting"
        exit 1
    fi
    echo "Package successfully created : $ARCHIVE"
}

### main 
generate_pkg
