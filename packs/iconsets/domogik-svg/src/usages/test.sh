#!/bin/bash
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
# - heating : bacause the off icon has no symbol and is more black
# For the exceptions, the 0.svg icon is copied

for folder in default air_conditioning appliance_2 music electricity computer appliance_1 light_spot
  do
    echo "[ $folder ]"
    fic100="${folder}_100.svg"
    fic0="${folder}_0.svg"
    cp -f $folder/100.svg $fic100
    cp -f $folder/100.svg $fic0
    sed -i "s/#9bb528/#222222/g" $fic0
    sed -i "s/#bdcb2f/#444444/g" $fic0
    sed -i "s/#b9c248/#666666/g" $fic0
    sed -i "s/#cdda93/#eeeeee/g" $fic0

    sed -i "s/#908d6f/#888888/g" $fic0
done
