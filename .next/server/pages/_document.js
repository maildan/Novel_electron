"use strict";(()=>{var e={};e.id=220,e.ids=[220],e.modules={8732:e=>{e.exports=require("react/jsx-runtime")},33873:e=>{e.exports=require("path")},40361:e=>{e.exports=require("next/dist/compiled/next-server/pages.runtime.prod.js")},41663:(e,t,r)=>{r.r(t),r.d(t,{default:()=>m});var s=r(8732),d=r(82341),a=r.n(d);class n extends a(){render(){return(0,s.jsxs)(d.Html,{children:[(0,s.jsx)(d.Head,{}),(0,s.jsxs)("body",{children:[(0,s.jsx)("script",{dangerouslySetInnerHTML:{__html:`
                (function() {
                  try {
                    // 저장된 테마 또는 시스템 선호도에 따른 다크모드 설정
                    const theme = localStorage.getItem('theme') ||
                      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
                    
                    // 즉시 class 추가하여 플래시 방지
                    if (theme === 'dark') {
                      document.documentElement.classList.add('dark');
                      document.documentElement.setAttribute('data-theme', 'dark');
                    } else {
                      document.documentElement.classList.remove('dark');
                      document.documentElement.setAttribute('data-theme', 'light');
                    }
                    
                    // 색상 스킴 설정
                    document.documentElement.style.colorScheme = theme;
                  } catch (e) {
                    // 오류 발생 시 기본 라이트 모드
                    console.warn('Theme initialization failed:', e);
                  }
                })();
              `}}),(0,s.jsx)(d.Main,{}),(0,s.jsx)(d.NextScript,{})]})]})}}let m=n},82015:e=>{e.exports=require("react")}};var t=require("../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),s=t.X(0,[341],()=>r(41663));module.exports=s})();