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
#Clean domoweb installation
#
#Implements
#==========
#
#
#@author: Ferllings < cedric@domogik.org>
#@copyright: (C) 2007-2012 Domogik project
#@license: GPL(v3)
#@organization: Domogik



function stop_domoweb {
    if [ -f "/etc/init.d/domoweb" -o -f "/etc/rc.d/domoweb" ];then
        if [ -d "/var/run/domoweb" ];then
            [ -f /etc/conf.d/domoweb ] && . /etc/conf.d/domoweb
            [ -f /etc/default/domoweb ] && . /etc/default/domoweb
            if [ -f "/etc/domoweb/domoweb.cfg" ];then
                echo "Domoweb is still running. Trying to stop it before uninstall..."
                /etc/init.d/domoweb stop
            fi
        fi
    else
        echo "It seems Domoweb is not installed : no /etc/init.d|rc.d/domoweb file"
        exit 16
    fi
}


# IS root user ?
if [ $UID -ne 0 ];then
    echo "Please restart this script as root!"
    exit 10
fi

# Ask for confirmation
echo "This script will uninstall completely Domoweb :"
echo "- Domoweb core"
echo "- Configuration"
echo "- Packages"
echo "- ..."
echo "Are you sure ? [y/N]"
read choice
if [ "x"$choice == "x" ] ; then
    choice=n
fi
if [ $choice != "y" -a $choice != "Y" ] ; then
    echo "Aborting..."
    exit 0
fi

stop_domoweb

[ ! -f /etc/default/domoweb ] && [ ! -f /etc/conf.d/domoweb ] && echo "File /etc/default/domoweb or /etc/conf.d/domowebk doesn't exists : exiting" && exit 1

[ -f /etc/conf.d/domoweb ] && . /etc/conf.d/domoweb && GLOBAL_CONFIG=/etc/conf.d/domoweb
[ -f /etc/default/domoweb ] && . /etc/default/domoweb && GLOBAL_CONFIG=/etc/default/domoweb

echo "DomoWeb installation found for user : $DOMOWEB_USER"

#RM="ls -l "  # for simulation
RM="rm -Rf "

echo "Delete /etc/default/domoweb"
$RM /etc/default/domoweb

echo "Delete rc.d script"
[ -f /etc/init.d/domoweb ] && $RM /etc/init.d/domoweb
[ -f /etc/rc.d/domoweb ] && $RM /etc/rc.d/domoweb

#echo "Delete /var/cache/domoweb"
#$RM /var/cache/domoweb

echo "Delete /var/lib/domoweb"
$RM /var/lib/domoweb

echo "Delete /var/log/domoweb"
$RM /var/log/domoweb

CONFIG_FOLDER=/etc/domoweb/
echo "Delete config folder : $CONFIG_FOLDER"
$RM $CONFIG_FOLDER

for fic in dmg_domoweb
  do
    TO_DEL=$(which $fic)
    echo "Delete $TO_DEL"
    $RM $TO_DEL
done

PY_FOLDER=$(dirname $(python -c "print __import__('domoweb').__path__[0]"))
if [ ${PY_FOLDER:0:5} == "/usr/" ] ; then
    echo "Remove python part : $PY_FOLDER"
    $RM $PY_FOLDER
else
    echo "Not removing $PY_FOLDER"
    echo "It seems to be development files"
fi

echo "Uninstall complete!"





