import React from 'react';
import styles from './spiner.module.css';

type PropsType = {
  style?: React.CSSProperties
};

export default function Spiner({ style }: PropsType) {
  return (
    <div className={styles.spiner} style={style} />
  );
}
