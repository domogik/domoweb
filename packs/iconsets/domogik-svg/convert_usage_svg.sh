#!/bin/bash
###############################################
# For the usage icons only!!!!!!!!
# For the usage icons only!!!!!!!!
# For the usage icons only!!!!!!!!
# For the usage icons only!!!!!!!!
###############################################
#
# Improve the svg files by removing useless tags and so on...
# Create also, when needed, the 'off' icon : 0.svg
#
# Dependancies : 
# - scour : pip install scour



#### First step : create the ./usage/ directory and fill it with improved filed

echo "The folder ./usages will be deleted to be recreated from the ./src/usages folder! To continue, press [enter]. Else, do [ctrl-c]"
read

rm -Rf ./usages/

for fic in $(find ./src/usages/ -name "*.svg")
  do
    newFic=$(echo $fic | sed "s#src/usages/#usages/#")
    echo "Converting '$fic' to '$newFic'..."

    ### create folder if needed
    mkdir -p $(dirname $newFic)

    ### apply scour
    scour --enable-id-stripping -i $fic -o $newFic
    [ $? -ne 0 ] && echo "Error! Exiting..." && exit 1

    ### some checks about svg format
    grep "<svg.*width=[0-9\.]*" $newFic > /dev/null
    [ $? -ne 0 ] && echo "Error! The svg file width and height attributes are not in the default value (px)!!! Please save the svg file in px format with inkscape" && exit 1

    ### manuel fixes for domogik usage

    # replace svg width and height
    sed -i 's/width="\([0-9\.]*\)mm"/width="\1"/' $newFic
    sed -i 's/height="\([0-9\.]*\)mm"/height="\1"/' $newFic
done


#### Second step : overwrite or create if needed the off icons : 0.svg
#
# Convert the green 'on' icones to grayscale
#
# This script looks for all 100.svg  icons and generate the corresponding 0.svg icon
#
# BUT... there are some exceptions...
#
#
#
# base colors :
# - #9bb528 (foncé
# - #bdcb2f (foncé
# - #b9c248 (moyen)
# - #cdda93 (clair)
#
#  # ???
# - #908d6f (wtf ?)


# Exceptions are :
# - mirror : because the off icon is a reversed mirror icon
# - heating : because the off icon has no symbol and is more black
# - nanoztag
# - shutter
# - ventilation

# For the exceptions, the 0.svg icon is copied

for folder in default air_conditioning appliance_2 music electricity computer appliance_1 light_spot server   telephony  television  temperature  water
  do
    echo "[ $folder ]"
    fic0="./usages/${folder}/0.svg"
    cp -f ./usages/$folder/100.svg $fic0
    sed -i "s/#9bb528/#222222/g" $fic0
    sed -i "s/#bdcb2f/#444444/g" $fic0
    sed -i "s/#b9c248/#666666/g" $fic0
    sed -i "s/#cdda93/#eeeeee/g" $fic0

    sed -i "s/#908d6f/#888888/g" $fic0
done

