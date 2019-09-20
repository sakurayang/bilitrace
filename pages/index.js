"use strict";
import Head from 'next/head';
import Link from 'next/link';
import style from "../static/style.css";
const Index = () => (
    <div>
        <Head>
            <title>Bilibili Data Trace</title>
            <meta name="viewport" content="initial-scale=1.0, width=device-width" key="viewport" />
        </Head>
        <Head>
            <meta name="viewport" content="initial-scale=1.2, width=device-width" key="viewport" />
        </Head>
        <div className={style.title}>
            <h1 style={{margin:0}}>Bilibili数据追踪</h1>
            <h3 style={{margin:0}}>Bilibili Date Trace</h3>
        </div>
        <div className={style.button}>
            <button><Link href='/add'><a><b>增加追踪</b></a></Link></button>
            <button><Link href='/remove'><a><b>删除追踪</b></a></Link></button>
            <button><Link href='/update'><a><b>更改追踪</b></a></Link></button>
            <button><Link href='/show'><a><b>展示数据</b></a></Link></button>
        </div>
    </div>
);


export default Index;