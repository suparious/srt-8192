import * as tf from '@tensorflow/tfjs';

interface TrainingData {
  features: number[][];
  labels: number[];
}

export class TutorialModel {
  private model: tf.Sequential;

  constructor() {
    this.model = tf.sequential();
    this.initializeModel();
  }

  /**
   * Initialize the model architecture
   */
  private initializeModel(): void {
    this.model.add(tf.layers.dense({ inputShape: [4], units: 8, activation: 'relu' }));
    this.model.add(tf.layers.dense({ units: 4, activation: 'relu' }));
    this.model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));

    this.model.compile({
      optimizer: 'adam',
      loss: 'binaryCrossentropy',
      metrics: ['accuracy'],
    });
  }

  /**
   * Train the model with provided data
   * @param data - Training data containing features and labels
   * @param epochs - Number of epochs to train the model
   */
  public async train(data: TrainingData, epochs: number = 50): Promise<tf.History> {
    const featureTensor = tf.tensor2d(data.features);
    const labelTensor = tf.tensor1d(data.labels);

    return await this.model.fit(featureTensor, labelTensor, {
      epochs,
      shuffle: true,
      callbacks: tf.callbacks.earlyStopping({ monitor: 'loss', patience: 5 }),
    });
  }

  /**
   * Make predictions using the trained model
   * @param features - Features to make predictions on
   * @returns Predicted values
   */
  public predict(features: number[][]): tf.Tensor {
    const featureTensor = tf.tensor2d(features);
    return this.model.predict(featureTensor) as tf.Tensor;
  }

  /**
   * Save the trained model
   * @param path - Path to save the model
   */
  public async saveModel(path: string): Promise<void> {
    await this.model.save(path);
  }
}

// Example usage
const tutorialModel = new TutorialModel();
const trainingData: TrainingData = {
  features: [
    [1, 0, 0, 1],
    [0, 1, 1, 0],
    [1, 1, 0, 0],
    [0, 0, 1, 1],
  ],
  labels: [1, 0, 1, 0],
};

tutorialModel.train(trainingData).then(() => {
  const predictions = tutorialModel.predict([[1, 0, 0, 1]]);
  predictions.print();
});
