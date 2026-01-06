declare module 'react-native-wheel-of-fortune' {
  import { Component } from 'react';
    import { TextStyle, ViewProps } from 'react-native';

  export interface WheelOfFortuneProps extends ViewProps {
    options: string[];
    knobSize?: number;
    borderWidth?: number;
    borderColor?: string;
    innerRadius?: number;
    duration?: number;
    backgroundColor?: string;
    onRef?: (ref: any) => void;
    getWinner?: (winnerIndex: number) => void;
    winnerBackgroundColor?: string;
    textStyle?: TextStyle;
    colors?: string[];
  }

  export default class WheelOfFortune extends Component<WheelOfFortuneProps> {}
}