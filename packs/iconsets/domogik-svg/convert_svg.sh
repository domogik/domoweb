#
# Improve the svg files by removing useless tags and so on...
#
# Dependancies : 
# - scour : pip install scour


for fic in $(find ./src/ -name "*.svg")
  do
    newFic=$(echo $fic | sed "s#src/#build/#")
    echo "Converting '$fic' to '$newFic'..."

    ### create folder if needed
    mkdir -p $(dirname $newFic)

    ### apply scour
    scour -i $fic -o $newFic
    [ $? -ne 0 ] && echo "Error! Exiting..." && exit 1

    ### some checks about svg format
    grep "<svg.*width=[0-9\.]*" $newFic > /dev/null
    [ $? -ne 0 ] && echo "Error! The svg file width and height attributes are not in the default value (px)!!! Please save the svg file in px format with inkscape" && exit 1

    ### manuel fixes for domogik usage

    # replace svg width and height
    sed -i 's/width="\([0-9\.]*\)mm"/width="\1"/' $newFic
    sed -i 's/height="\([0-9\.]*\)mm"/height="\1"/' $newFic
done

