(this["webpackJsonpwho-that-mask"]=this["webpackJsonpwho-that-mask"]||[]).push([[0],{13:function(e,t,n){e.exports={outline:"Output_outline__30pg-",line:"Output_line__3suFW",grid:"Output_grid__2lwKT"}},25:function(e,t,n){},26:function(e,t,n){"use strict";n.r(t);var a=n(3),r=n.n(a),i=n(15),s=n.n(i),u=n(17),c=n(2),h=n(6),o=n(7),d=n(5),l=n(9),f=n(8),p=n(1),v=n.n(p),b=n(4),j=n(10),O=n(16),m=n.n(O),g=n(13),x=n.n(g),w=n(0),k=function(e){Object(l.a)(n,e);var t=Object(f.a)(n);function n(){return Object(h.a)(this,n),t.apply(this,arguments)}return Object(o.a)(n,[{key:"shouldComponentUpdate",value:function(e,t){return e.canRender}},{key:"checkWidth",value:function(e){var t=this.props,n=t.id;(0,t.enqueueLineUpdate)(n,e)}},{key:"render",value:function(){var e=this,t=this.props,n=t.cls,a=t.stl,r=this.props.children;return Object(w.jsxs)("div",{style:a,className:n,ref:function(t){if(t){var n=t.getBoundingClientRect().width;e.checkWidth(n)}},children:[r,Object(w.jsx)("br",{})]})}}]),n}(a.Component),y=function(e){Object(l.a)(n,e);var t=Object(f.a)(n);function n(){return Object(h.a)(this,n),t.apply(this,arguments)}return Object(o.a)(n,[{key:"shouldComponentUpdate",value:function(e,t){return this.props.children!==e.children}},{key:"render",value:function(){var e=this.props.children;return" "===e?Object(w.jsx)(a.Fragment,{children:"\xa0"}):e}}]),n}(a.Component),C=function(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:[];return{numRenders:0,elWidthDiff:0,elWidth:0,line:e}},S=function(e){return Object(j.a)(Array(e).keys()).map((function(){return C([])}))},L=function(e){return e.line.slice(-1)[0]},R=function(e,t,n){return t&&0!==n&&!e.has(t)?M(e,t,Math.abs(n)):e},M=function(e,t,n){return new Map([].concat(Object(j.a)(e),[[t,n]]))},W=function(e,t,n){return e.map((function(e,a){return a===t?n:e}))},U=function(e,t){return Math.floor(Math.min(e,t))},N=function(e,t){return Math.floor(e)===Math.floor(t)},H=function(e,t){return e[t%e.length]},T=function(e,t){var n=m()(e,t);return Object(b.a)(v.a.mark((function e(){var t,a,r,i=this,s=arguments;return v.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:for(t=s.length,a=new Array(t),r=0;r<t;r++)a[r]=s[r];return e.next=3,new Promise((function(e){n.apply(i,a).then((function(t){e(t)})).catch((function(){e(null)}))}));case 3:return e.abrupt("return",e.sent);case 4:case"end":return e.stop()}}),e)})))},_=function(e){Object(l.a)(n,e);var t=Object(f.a)(n);function n(e){var a;Object(h.a)(this,n),a=t.call(this,e);var r=window,i=r.innerWidth,s=r.innerHeight,u=U(450,i),c=U(950,s),o=S(Math.floor(c/16));return a.state={lines:o,idealHeight:950,idealWidth:450,maxHeight:c,maxWidth:u,fontSize:16,label:"missingno",canRender:!0,widthMap:new Map},a.updateShape=T(a.updateShape,333).bind(Object(d.a)(a)),a.resetLines=T(a.resetLines,333).bind(Object(d.a)(a)),a.enqueueLineUpdate=a.enqueueLineUpdate.bind(Object(d.a)(a)),a.addCharsToLine=a.addCharsToLine.bind(Object(d.a)(a)),a.addCharToLine=a.addCharToLine.bind(Object(d.a)(a)),a.lineQueue=Promise.resolve(!0),a}return Object(o.a)(n,[{key:"getShape",value:function(){var e=this.state,t=e.idealWidth,n=e.idealHeight,a=this.state,r=a.maxWidth,i=a.maxHeight;return{width:U(t,r),height:U(n,i)}}},{key:"getMaxLines",value:function(){var e=this.state.fontSize,t=this.getShape().height;return Math.floor(t/e)}},{key:"newLine",value:function(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:[];return C(e)}},{key:"newChar",value:function(e){var t=e.offset,n=void 0===t?-1:t,a=e.char;return{offset:n,char:void 0===a?"?":a}}},{key:"getNextOffsetByColumn",value:function(e,t){var n=e.elWidth,a=this.getShape().width,r=this.state,i=r.label,s=r.widthMap,u=Object(j.a)(Array(a).keys()).reduce((function(e,t){var a=e.prior,r=e.sumWidth,u=s.get(H(i,t))||0;return r+u>=n?{prior:a,sumWidth:r}:{prior:t,sumWidth:r+u}}),{prior:-1,sumWidth:0}).prior;return Math.max(u+t,0)}},{key:"getNextOffset",value:function(e,t){var n=(L(e)||{offset:-1}).offset;return Math.max(n+t,0)}},{key:"getNextChar",value:function(e,t){var n=this,a=this.state.label,r=this.props,i=r.alignment,s=r.space,u=function(){if("column"===i&&t>0&&(L(e)||{}).char===s)return n.getNextOffsetByColumn(e,t);return n.getNextOffset(e,t)}(),c=H(a,u);return this.newChar({offset:u,char:c})}},{key:"getLastLine",value:function(e){return e.slice(-1)[0]||this.newLine()}},{key:"getRatios",value:function(e,t){var n=this.getMaxLines();return{widthRatio:e/this.getShape().width,heightRatio:(t+.5)/n}}},{key:"checkRatios",value:function(e,t){var n=this.getRatios(e,t),a=n.widthRatio,r=n.heightRatio;return!(a>1||r>1)}},{key:"readMask",value:function(e){var t=e.lineState,n=e.lineIdx,a=t.elWidth;if(!this.checkRatios(a,n))return null;var r=this.getRatios(a,n),i=r.widthRatio,s=r.heightRatio,u=[[0,0,0,0,0,0,0,0,0],[0,0,0,0,1,1,1,0,0],[0,0,0,0,1,1,1,0,0],[0,0,0,0,1,1,1,0,0],[0,0,0,0,1,1,1,0,0],[0,0,0,0,1,1,1,0,0],[0,0,1,1,1,1,1,0,0],[0,0,1,1,1,1,1,0,0],[0,0,1,1,1,1,1,0,0],[0,0,1,1,1,1,1,0,0],[0,0,1,1,1,1,1,0,0],[0,0,1,1,1,1,1,0,0],[0,0,1,1,1,1,1,0,0],[0,0,1,1,1,1,1,0,0],[0,0,0,0,0,0,0,0,0]],c=Math.floor(i*u[0].length);if(u[Math.floor(s*u.length)][c]){var h=this.props.space;return this.newChar({offset:this.getNextOffset(t,0),char:h})}return this.getNextChar(t,1)}},{key:"addCharToLine",value:function(e,t){if(e.done)return e;var n=e.lineState,a=e.hiddenChars;if(a.length>0&&n.line.length>0)return Object(c.a)(Object(c.a)({},e),{},{done:!0,lineState:Object(c.a)(Object(c.a)({},n),{},{line:n.line.concat([a.slice(-1)[0]])}),hiddenChars:a.slice(0,-1)});var r=this.readMask(e);if(null===r)return e;var i=r.char,s=e.lineIdx,u=e.iMax,h=n.elWidth,o=this.state.widthMap.get(i)||0,d=h+o;if(!this.checkRatios(d,s))return Object(c.a)(Object(c.a)({},e),{},{done:!0});var l=[t===u,o<1].some((function(e){return e}));return Object(c.a)(Object(c.a)({},e),{},{lineState:Object(c.a)(Object(c.a)({},n),{},{line:n.line.concat([r]),elWidth:l?h:d}),done:l})}},{key:"addCharsToLine",value:function(e,t,n){var a=e.num,r=e.lines,i=e.hiddenChars;if(!this.canLineRender(t))return e;var s=Object(j.a)(Array(a).keys()).reduce(this.addCharToLine,{iMax:a-1,done:!1,lineState:t,lineIdx:n,hiddenChars:i});return Object(c.a)(Object(c.a)({},e),{},{allReady:!1,hiddenChars:s.hiddenChars,lines:W(r,n,s.lineState)})}},{key:"listHiddenChars",value:function(){var e=this,t=this.props.space,n=this.state,a=n.widthMap;return n.label.split("").concat([t]).reduce((function(t,n){return a.has(n)?t:[e.newChar({char:n,offset:-1})].concat(Object(j.a)(t))}),[])}},{key:"onColumnUpdate",value:function(){var e=this;return new Promise((function(t){var n=e.state.lines,a=n.reduce(e.addCharsToLine,{hiddenChars:e.listHiddenChars(),num:e.props.stepSize,allReady:!0,lines:n});return a.allReady?e.setState({canRender:!1},t):e.setState({canRender:!0,lines:a.lines},t)}))}},{key:"updateLine",value:function(e,t){var n=this.getShape().width,a=e.numRenders,r=(L(e)||{offset:0}).offset;return t>n||r<0?Object(c.a)(Object(c.a)({},e),{},{line:e.line.slice(0,-1),elWidthDiff:e.elWidth-t}):Object(c.a)(Object(c.a)({},e),{},{elWidth:t,numRenders:a+1,elWidthDiff:t-e.elWidth})}},{key:"onLineUpdate",value:function(e,t){var n=this;return new Promise((function(a){var r=n.state,i=r.lines,s=r.widthMap;if(e<i.length){var u=(L(i[e])||{}).char,c=n.updateLine(i[e],t),h=c.elWidthDiff;n.setState({widthMap:R(s,u,h),lines:W(i,e,c),canRender:!1},a)}}))}},{key:"enqueueLineUpdate",value:function(e,t){var n=this;this.lineQueue.then(Object(b.a)(v.a.mark((function a(){return v.a.wrap((function(a){for(;;)switch(a.prev=a.next){case 0:return a.next=2,n.onLineUpdate(e,t);case 2:return a.abrupt("return",a.sent);case 3:case"end":return a.stop()}}),a)}))))}},{key:"canLineRender",value:function(e){if(!e)return!1;var t=e.numRenders,n=e.elWidthDiff;return!(t>=2&&0===n)}},{key:"updateShape",value:function(){var e=Object(b.a)(v.a.mark((function e(){var t,n,a,r,i,s,u,c,h,o=this;return v.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:t={},n=this.getShape(),a=this.state,r=a.maxWidth,i=a.maxHeight,s=a.fontSize,u=window,c=u.innerWidth,h=u.innerHeight,N(r,c)||(t.maxWidth=Math.floor(c)),N(i,h)||(t.maxHeight=Math.floor(h)),this.setState(t,Object(b.a)(v.a.mark((function e(){var t,a,r,i;return v.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:if(t=o.getShape(),a=t.height,r=t.width,n.height!==a||n.width!==r){e.next=3;break}return e.abrupt("return");case 3:return e.next=5,o.lineQueue;case 5:i=Math.floor(a/s),o.setState({canRender:!0,lines:S(i)});case 7:case"end":return e.stop()}}),e)}))));case 7:case"end":return e.stop()}}),e,this)})));return function(){return e.apply(this,arguments)}}()},{key:"resetLines",value:function(){var e=Object(b.a)(v.a.mark((function e(){var t;return v.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return t=this.state.lines,e.next=3,this.lineQueue;case 3:this.setState({canRender:!0,lines:S(t.length)});case 4:case"end":return e.stop()}}),e,this)})));return function(){return e.apply(this,arguments)}}()},{key:"componentDidMount",value:function(){var e=Object(b.a)(v.a.mark((function e(){var t=this;return v.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return window.addEventListener("resize",Object(b.a)(v.a.mark((function e(){return v.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return e.next=2,t.updateShape();case 2:case"end":return e.stop()}}),e)})))),e.next=3,this.onColumnUpdate();case 3:case"end":return e.stop()}}),e,this)})));return function(){return e.apply(this,arguments)}}()},{key:"componentDidUpdate",value:function(){var e=Object(b.a)(v.a.mark((function e(){return v.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return e.next=2,this.lineQueue;case 2:return e.next=4,this.onColumnUpdate();case 4:case"end":return e.stop()}}),e,this)})));return function(){return e.apply(this,arguments)}}()},{key:"shouldComponentUpdate",value:function(e,t){var n=this.props.alignment;return e.alignment!==n?(this.resetLines(),!1):t.canRender}},{key:"render",value:function(){var e=this,t=this.state.fontSize,n=this.state.lines,a=this.getShape(),r=a.width,i=a.height,s={fontSize:"".concat(t,"px")},u={width:"".concat(r,"px"),height:"".concat(i,"px")},c=Object(w.jsx)("div",{style:s,className:x.a.outline,children:n.map((function(n,a){var r={top:a*t};return Object(w.jsx)(k,{enqueueLineUpdate:e.enqueueLineUpdate,canRender:e.canLineRender(n),stl:r,cls:x.a.line,id:a,children:n.line.map((function(e,t){var n=e.char;return Object(w.jsx)(y,{children:n},t)}))},a)}))});return Object(w.jsxs)("div",{className:x.a.grid,children:[Object(w.jsx)("div",{}),Object(w.jsx)("div",{style:u,children:c}),Object(w.jsx)("div",{})]})}}]),n}(a.Component);var z=function(){var e=Object(a.useState)(!0),t=Object(u.a)(e,2),n=t[0],r=t[1],i=["row","column"][+n];return Object(w.jsxs)("div",{className:"App",children:[Object(w.jsxs)("div",{children:["Align columns:",Object(w.jsx)("input",{type:"checkbox",checked:n,onChange:function(e){return r(e.target.checked)}})]}),Object(w.jsx)(_,{space:" ",stepSize:100,alignment:i})]})};n(25);s.a.render(Object(w.jsx)(r.a.StrictMode,{children:Object(w.jsx)(z,{})}),document.getElementById("root"))}},[[26,1,2]]]);
//# sourceMappingURL=main.80f1f8a4.chunk.js.map