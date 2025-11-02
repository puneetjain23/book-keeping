import React from 'react';

export default function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={'p-2 rounded border w-full ' + (props.className || '')} />;
}
