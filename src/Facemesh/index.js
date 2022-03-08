// Copyright (c) 2020 ml5
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

/* eslint prefer-destructuring: ["error", {AssignmentExpression: {array: false}}] */
/* eslint no-await-in-loop: "off" */

/*
 * Facemesh: Facial landmark detection in the browser
 * Ported and integrated from all the hard work by: https://github.com/tensorflow/tfjs-models/tree/master/facemesh
 */

import * as tf from "@tensorflow/tfjs";
import * as facemeshCore from "@tensorflow-models/facemesh";
import { EventEmitter } from "events";
import callCallback from "../utils/callcallback";
import handleArguments from "../utils/handleArguments";

class Facemesh extends EventEmitter {
  /**
   * Create Facemesh.
   * @param {HTMLVideoElement} video - An HTMLVideoElement.
   * @param {object} options - An object with options.
   * @param {function} callback - A callback to be called when the model is ready.
   */
  constructor(video, options, callback) {
    super();

    this.video = video;
    this.model = null;
    this.modelReady = false;
    this.config = options;

    this.ready = callCallback(this.loadModel(), callback);
  }

  /**
   * Load the model and set it to this.model
   * @return {this} the Facemesh model.
   */
  async loadModel() {
    this.model = await facemeshCore.load(this.config);
    this.modelReady = true;

    if (this.video && this.video.readyState === 0) {
      await new Promise(resolve => {
        this.video.onloadeddata = () => {
          resolve();
        };
      });
    }

    this.predict();

    return this;
  }

  /**
   * Load the model and set it to this.model
   * @return {this} the Facemesh model.
   */
  async predict(inputOr, cb) {
    const { image, callback } = handleArguments(this.video, inputOr, cb);
    const { flipHorizontal } = this.config;
    const predictions = await this.model.estimateFaces(image, flipHorizontal);
    const result = predictions;
    // Soon, we will remove the 'predict' event and prefer the 'face' event. During
    // the interim period, we will both events.
    this.emit("predict", result);
    this.emit("face", result);

    if (this.video) {
      return tf.nextFrame().then(() => this.predict());
    }

    if (typeof callback === "function") {
      callback(result);
    }

    return result;
  }
}

const facemesh = (...inputs) => {
  const { video, options = {}, callback } = handleArguments(...inputs);
  const instance = new Facemesh(video, options, callback);
  return callback ? instance : instance.ready;
};

export default facemesh;
