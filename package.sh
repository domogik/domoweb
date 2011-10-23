#!/bin/bash

REVISION=27b13bbf11e0
RELEASE=0.2.0-alpha1-$REVISION
SHORT_RELEASE=0.2.0-alpha1  # for base directory

ARCHIVE=/tmp/domoweb-$SHORT_RELEASE.tgz

function generate_pkg() {
    echo "Generate package..."
    hg archive \
    -p domoweb-$SHORT_RELEASE \
    -r $REVISION \
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

### main 
generate_pkg
