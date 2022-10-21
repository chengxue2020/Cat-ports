var rule = Object.assign(muban.mxpro,{
title:'追剧达人',
host:'http://zjdr.tv',
url:'/vodshow/id/fyclass/page/fypage.html',
class_parse:'.navbar-items li:gt(1):lt(6);a&&Text;a&&href;.*/(.*?).html',
});