def display_tree(handler, section, level):
	childrens = section._get_childrens()
	newlevel = level + 1
	output = u""
	if (len(childrens) > 0):
		output += u"<ul class='level-%d'>" % newlevel
		output += u"<li class='level-main'><a data-section='%d' href='#'>%s</a></li>" % (section.id, section.name)
		for child in childrens:
			output += u"<li><a data-section='%d' href='#'>%s</a>" % (child.id, child.name)
			output += display_tree(handler, child, newlevel)
			output += u"</li>"
		output += u"</ul>"
	else:
		if level == 0: # Root case
			output += u"<ul class='level-%d'>" % newlevel
			output += u"<li class='level-main'><a data-section='%d' href='#'>%s</a></li>" % (section.id, section.name)
			output += u"</ul>"
	return output