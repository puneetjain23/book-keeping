import React from 'react';

export default function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={'p-2 rounded border w-full ' + (props.className || '')} />;
}
