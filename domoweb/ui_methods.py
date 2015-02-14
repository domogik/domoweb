def display_tree(handler, section, level):
	childrens = section._get_childrens()
	output = u""
	if (len(childrens) > 0):
		output += u"<ul class='level-%d'>" % level
		for child in childrens:
			output += u"<li><a data-section='%d' href='#'>%s</a>" % (child.id, child.name)
			output += display_tree(handler, child, level+1)
			output += u"</li>"
		output += u"</ul>"
	return output