(this["webpackJsonpwhos-that-outline"]=this["webpackJsonpwhos-that-outline"]||[]).push([[0],{17:function(e,t,n){},18:function(e,t,n){"use strict";n.r(t);var i=n(1),a=n.n(i),r=n(11),s=n.n(r),l=n(10),h=n(7),o=n(2),c=n(3),u=n(6),d=n(5),f=n(4),v=n(8),p=n.n(v),b=n(0),g=function(e){Object(d.a)(n,e);var t=Object(f.a)(n);function n(){return Object(o.a)(this,n),t.apply(this,arguments)}return Object(c.a)(n,[{key:"shouldComponentUpdate",value:function(e,t){var n=this.props.ready,i=e.ready;return!(n&&i)}},{key:"checkWidth",value:function(e){var t=this.props,n=t.id,i=t.ready,a=t.fullWidth;if(!i){var r=this.props,s=r.onLineReady,l=r.addChars,h=a-e;if(h>0){var o=this.props,c=o.labelWidth;l(o.copies<1||c<1||c>1&&h<c?1:Math.floor(h/c),e)}else s(n)}}},{key:"render",value:function(){var e=this,t=this.props,n=t.cls,i=t.stl,a=this.props.children;return Object(b.jsx)("div",{style:i,className:n,ref:function(t){t&&e.checkWidth(t.clientWidth)},children:a})}}]),n}(i.Component),j=function(e){Object(d.a)(n,e);var t=Object(f.a)(n);function n(){return Object(o.a)(this,n),t.apply(this,arguments)}return Object(c.a)(n,[{key:"shouldComponentUpdate",value:function(e,t){return this.props.children!==e.children}},{key:"render",value:function(){var e=this.props.children;return" "===e?Object(b.jsx)(i.Fragment,{children:"\xa0"}):e}}]),n}(i.Component),y=function(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:[];return{ready:!1,line:e,copies:0}},O=function(e,t){return Math.floor(Math.min(e,t))},x=function(e,t){return Math.floor(e)===Math.floor(t)},m=function(e){Object(d.a)(n,e);var t=Object(f.a)(n);function n(e){var i;Object(o.a)(this,n),i=t.call(this,e);var a=[450,950],r=window,s=r.innerWidth,l=r.innerHeight;return i.state={maxHeight:O(a[1],l),maxWidth:O(a[0],s),idealHeight:a[1],idealWidth:a[0],fontSize:12,lines:[y()],label:"missingno",labelWidth:0},i.onLineReady=i.onLineReady.bind(Object(u.a)(i)),i.updateShape=i.updateShape.bind(Object(u.a)(i)),i.addChars=i.addChars.bind(Object(u.a)(i)),i}return Object(c.a)(n,[{key:"updateShape",value:function(){var e={},t=this.state,n=t.maxWidth,i=t.maxHeight,a=window,r=a.innerWidth,s=a.innerHeight;x(n,r)||(e.maxWidth=Math.floor(r)),x(i,s)||(e.maxHeight=Math.floor(s)),this.setState(e)}},{key:"getShape",value:function(){var e=this.state,t=e.idealWidth,n=e.idealHeight,i=this.state,a=i.maxWidth,r=i.maxHeight;return{width:O(t,a),height:O(n,r)}}},{key:"getMaxLines",value:function(){var e=this.state.fontSize,t=this.getShape().height;return Math.floor(t/e)}},{key:"isWholeLabel",value:function(e){var t=this.state.label,n=e[e.length-1];return e.length>1&&function(e,t,n){return"offset"in e&&"offset"in t&&e.offset%n.length===t.offset%n.length}(e[0],n,t)}},{key:"newLine",value:function(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:[];return y(e)}},{key:"newChar",value:function(e){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:null,n=this.state.label;return{char:null===t?n[e%n.length]:t,offset:e}}},{key:"getNextOffset",value:function(e){return(e[e.length-1]||this.newChar(-1,null)).offset+1}},{key:"getLastLine",value:function(e){return e[e.length-1]||this.newLine()}},{key:"addCharToLine",value:function(e){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:null,n=e.line,i=e.copies,a=this.getNextOffset(n),r=this.newChar(a,t),s=n.concat([r]),l=this.isWholeLabel(s),o=i+(l?1:0);return Object(h.a)(Object(h.a)({},e),{},{line:s,copies:o})}},{key:"addChars",value:function(e,t){var n=this,i=this.state.lines,a=[[0,0,0,0,0,0,0,0,0],[0,0,0,0,1,1,1,0,0],[0,0,0,0,1,1,1,0,0],[0,0,0,0,1,1,1,0,0],[0,0,0,0,1,1,1,0,0],[0,0,0,0,1,1,1,0,0],[0,0,1,1,1,1,1,0,0],[0,0,1,1,1,1,1,0,0],[0,0,1,1,1,1,1,0,0],[0,0,1,1,1,1,1,0,0],[0,0,1,1,1,1,1,0,0],[0,0,1,1,1,1,1,0,0],[0,0,1,1,1,1,1,0,0],[0,0,1,1,1,1,1,0,0],[0,0,0,0,0,0,0,0,0]],r=this.getShape().width,s=this.getMaxLines(),h=Object(l.a)(Array(e).keys()).reduce((function(e,l){var h=1===function(e){var l=n.state,h=l.label,o=l.labelWidth/h.length,c=t+e*o,u=Math.floor(c/r*a[0].length),d=Math.floor((i.length-1)/s*a.length);return a[d][u]}(l)?" ":null,o=n.addCharToLine(e.lastLine,h);return{labelWidth:e.labelWidth||(1===o.copies?t:null),lastLine:o}}),{labelWidth:this.state.labelWidth,lastLine:this.getLastLine(i)}),o=h.lastLine,c=h.labelWidth,u=i.slice(0,-1).concat([o]);this.setState({lines:u,labelWidth:c})}},{key:"addLines",value:function(){var e=this,t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:1;if(1===t){var n=Object(l.a)(Array(t).keys()),i=n.reduce((function(t){var n=e.getLastLine(t.lines),i=e.getNextOffset(n.line);return{lines:t.lines.concat([e.newLine([e.newChar(i,null)])])}}),{lines:this.state.lines}),a=i.lines;this.setState({lines:a})}else console.error("Cannot add multiple lines yet")}},{key:"onLineReady",value:function(e){var t=this.state.lines;if(e<t.length){var n=t.map((function(t,n){return e===n?Object(h.a)(Object(h.a)({},t),{},{ready:!0}):t}));this.setState({lines:n})}}},{key:"componentDidMount",value:function(){var e=this;window.addEventListener("resize",this.updateShape),this.timer=setInterval((function(){var t=e.state.lines,n=e.getMaxLines();e.getLastLine(t).ready&&t.length<n&&e.addLines(1)}),100)}},{key:"componentWillUnmount",value:function(){clearInterval(this.timer)}},{key:"render",value:function(){var e=this,t=this.state.fontSize,n=this.state,i=n.lines,a=n.labelWidth,r=this.getShape(),s=r.width,l=r.height,h={fontSize:"".concat(t,"px")},o={width:"".concat(s,"px"),height:"".concat(l,"px")},c=Object(b.jsx)("div",{style:h,className:p.a.outline,children:i.map((function(n,i){var r=n.line,l=n.copies,h=n.ready,o={top:i*t};return Object(b.jsx)(g,{addChars:e.addChars,onLineReady:e.onLineReady,labelWidth:a,fullWidth:s,copies:l,ready:h,stl:o,cls:p.a.line,id:i,children:r.map((function(e,t){var n=e.char;return Object(b.jsx)(j,{children:n},t)}))},i)}))});return Object(b.jsxs)("div",{className:p.a.grid,children:[Object(b.jsx)("div",{}),Object(b.jsx)("div",{style:o,children:c}),Object(b.jsx)("div",{})]})}}]),n}(i.Component);var L=function(){return Object(b.jsxs)("div",{className:"App",children:[Object(b.jsx)("div",{children:"Hello Missingo"}),Object(b.jsx)(m,{})]})};n(17);s.a.render(Object(b.jsx)(a.a.StrictMode,{children:Object(b.jsx)(L,{})}),document.getElementById("root"))},8:function(e,t,n){e.exports={outline:"Output_outline__30pg-",line:"Output_line__3suFW",grid:"Output_grid__2lwKT"}}},[[18,1,2]]]);
//# sourceMappingURL=main.4b1d80b1.chunk.js.map