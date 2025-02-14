import React from "react";
import Image from "next/image";
import Mira from "../../public/mira.png";
import MiraWhite from "../../public/mira-white.png";
import Link from "next/link";
export default function LogoRender() {
  return (
    <>
      <Link href="/" className="flex flex-row dark:hidden gap-1 items-center">
        <Image src={Mira} alt="Mira ai" width={36} height={36} className="" />
        <h1 className="text-xl font-bold">Gitstark</h1>
      </Link>
      <Link href="/" className="flex flex-row dark:flex gap-1 items-center">
        <Image
          src={MiraWhite}
          alt="Mira ai"
          width={36}
          height={36}
          className=""
        />
        <h1 className="text-xl font-bold">Gitstark</h1>
      </Link>
    </>
  );
}
