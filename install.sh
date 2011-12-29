#!/bin/bash
#This file is part of B{Domogik} project (U{http://www.domogik.org}).
#
#License
#=======
#
#B{Domogik} is free software: you can redistribute it and/or modify
#it under the terms of the GNU General Public License as published by
#the Free Software Foundation, either version 3 of the License, or
#(at your option) any later version.
#
#B{Domogik} is distributed in the hope that it will be useful,
#but WITHOUT ANY WARRANTY; without even the implied warranty of
#MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
#GNU General Public License for more details.
#
#You should have received a copy of the GNU General Public License
#along with Domogik. If not, see U{http://www.gnu.org/licenses}.
#
#Module purpose
#==============
#
#Help to manage DomoWeb installation
#
#Implements
#==========
#
#
#@author: Maxence Dunnewind <maxence@dunnewind.net>
#@copyright: (C) 2007-2009 Domogik project
#@license: GPL(v3)
#@organization: Domogik

DMG_HOME=

function run_setup_py {
    MODE=$1
    case $MODE in
        develop|install)
            if [ -f "setup.py" ];then
                python ./ez_setup.py
                python ./setup.py $MODE
                if [ "x$?" != "x0" ];then
                    echo "setup.py script exists with a non 0 return value : $?"
                    exit 13
                fi
            else
                echo "Can't find setup.py, did you download the sources correctly? "
                exit 1
            fi
        ;;
        *)
            echo "Only develop and install modes are available"
        ;;
    esac
}

function test_sources {
    FILENAME=$1
    [ -d "$PWD/src" ] ||( echo "Can't find src/ directory, are you running this script from the sources main directory? (with ./$FILENAME" && exit 2 )
    [ -f "src/examples/config/domoweb.cfg" ] ||( echo "Can't find src/examples/config/domoweb.cfg file!" && exit 3 )
    [ -f "src/examples/default/domoweb" ] ||( echo "Can't find src/examples/default/domoweb file!" && exit 4 )
    [ -f "src/examples/init/domoweb" ] ||( echo "Can't find src/examples/init/domoweb!" && exit 5 )
}

function copy_sample_files {
    read -p "Which user will run domogik, it will be created if it does not exist yet? (default : domogik) " d_user
    d_user=${d_user:-domogik}
    if ! getent passwd $d_user >/dev/null;then
        echo "I can't find informations about this user !"
        read -p "Do you want to create it ? (y/n) " create
        if [ "$create" = "y" ];then
            adduser $d_user
        else
            echo "Please restart this script when the user $d_user will exist."
            exit 9
        fi
    fi
    d_home=$(getent passwd $d_user |cut -d ':' -f 6)
    dmg_home=$d_home/.domogik
    keep="n"
    already_cfg=
    if [ ! -d $dmg_home ];then
        mkdir $dmg_home
        chown $d_user $dmg_home
    fi

    if [ ! -f $dmg_home/domoweb.cfg ];then
        cp -f src/examples/config/domoweb.cfg $dmg_home/domoweb.cfg
        chown $d_user: src/examples/config/domoweb.cfg $dmg_home/domoweb.cfg
    else
        keep="y"
        already_cfg=1
        read -p "You already have Domoweb configuration files. Do you want to keep them ? [Y/n]" keep
        if [ "x$keep" = "x" ];then
            keep="y"
        fi
        if [ "$keep" = "n" -o "$keep" = "N" ];then
            cp -f src/examples/config/domoweb.cfg $dmg_home/domoweb.cfg
            chown $d_user: src/examples/config/domoweb.cfg $dmg_home/domoweb.cfg
        fi
    fi
    
    if [ -d "/etc/default/" ];then
        if [ "$keep" = "n" -o "$keep" = "N" ];then
            cp src/examples/default/domoweb /etc/default/
        fi
    else
        echo "Can't find the directory where I can copy system-wide config. Usually it is /etc/default/"
        exit 6
    fi
    if [ -d "/etc/init.d/" ];then
        cp src/examples/init/domoweb /etc/init.d/
        chmod +x /etc/init.d/domoweb
    elif [ -d "/etc/rc.d/" ];then
        cp src/examples/init/domoweb /etc/rc.d/
        chmod +x /etc/rc.d/domoweb
    else
        echo "Init directory does not exist (/etc/init.d or /etc/rc.d)"
        exit 7
    fi
}

function update_default_config {
    if [ ! -f /etc/default/domoweb ];then
        echo "Can't find /etc/default/domoweb!"
        exit 8
    fi
    [ -f /etc/default/domoweb ] &&  sed -i "s;^DOMOWEB_USER.*$;DOMOWEB_USER=$d_user;" /etc/default/domoweb
}

function check_python {
if [ ! -x "$(which python)" ];then
        echo "No python binary found, please install at least python2.6";
        exit 11
    else
        if python -V 2>&1|grep -qs "Python 2.[345]";then
            echo "Bad python version used, please install at least 2.6, and check /usr/bin/python starts the good version."
            exit 12
        fi
fi
}

function create_log_dir {
    mkdir -p /var/log/domogik
    chown -R $d_user: /var/log/domogik 
}

function init_django_db {
    python ./src/domoweb/manage.py syncdb --noinput
    chown $d_user: $dmg_home/domoweb.db
}

#Main part
if [ $UID -ne 0 ];then
    echo "Please restart this script as root!"
    exit 10
fi
if [ "$(dirname $0)" != "." ];then
    echo "Please run this script from main source directory (as ./install.sh"
    exit 15
fi

check_python
test_sources $0
read -p "Which install mode do you want (choose develop if you don't know)? [install/develop] : " MODE
while [ "$MODE" != "develop" -a "$MODE" != "install" ];do
    read -p "Which install mode do you want? [install/develop] : " MODE
done
read -p "If you want to use a proxy, please set it now. It will only be used during installation. (ex: http://1.2.3.4:8080)" http_proxy
if [ "x$http_proxy" != "x" ];then
    export http_proxy
fi
#this is needed now only because of old bug (#792) and should be useless for new install
if [ "$SUDO_USER" ];then
    trap "[ -d \"$HOME/.python-eggs\" ] && chown -R $SUDO_USER: $HOME/.python-eggs" EXIT
    [ -d "$HOME/.python-eggs" ] && chown -R $SUDO_USER: $HOME/.python-eggs/ 
else
    trap "[ -d \"$HOME/.python-eggs\" ] && chown -R $USER: $HOME/.python-eggs" EXIT
    [ -d "$HOME/.python-eggs" ] && chown -R $USER: $HOME/.python-eggs/ 
fi

run_setup_py $MODE
copy_sample_files
update_default_config
init_django_db
create_log_dir

echo "Everything seems to be good, DomoWeb should be installed correctly."
echo "I will start the test_config.py script to check it."
read -p "Please press Enter when ready."
chmod +x ./test_config.py && ./test_config.py
if [ "$SUDO_USER" ];then
    [ -d "$HOME/.python-eggs" ] && chown -R $SUDO_USER: $HOME/.python-eggs/ 
else
    [ -d "$HOME/.python-eggs" ] && chown -R $USER: $HOME/.python-eggs/ 
fi
trap - EXIT


