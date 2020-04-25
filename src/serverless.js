const aws = require('aws-sdk')
const { equals } = require('ramda')
const { Component } = require('@serverless/core')
const {
  createCloudFrontDistribution,
  updateCloudFrontDistribution,
  deleteCloudFrontDistribution
} = require('./lib')

class CloudFront extends Component {
  /**
   * Deploy
   * @param {*} inputs
   */
  async deploy(inputs = {}) {
    inputs.region = inputs.region || 'us-east-1'
    inputs.enabled = inputs.enabled === false ? false : true
    inputs.comment =
      inputs.comment === null || inputs.comment === undefined ? '' : String(inputs.comment)

    console.log(`Starting deployment of CloudFront distribution to the ${inputs.region} region.`)

    const cf = new aws.CloudFront({
      credentials: this.credentials.aws,
      region: inputs.region
    })

    const s3 = new aws.S3({
      credentials: this.credentials.aws,
      region: inputs.region
    })

    if (this.state.id) {
      if (
        !equals(this.state.origins, inputs.origins) ||
        !equals(this.state.defaults, inputs.defaults) ||
        !equals(this.state.enabled, inputs.enabled)
      ) {
        console.log(`Updating CloudFront distribution of ID ${this.state.id}.`)
        this.state = await updateCloudFrontDistribution(cf, s3, this.state.id, inputs)
      }
    } else {
      console.log(`Creating CloudFront distribution in the ${inputs.region} region.`)
      this.state = await createCloudFrontDistribution(cf, s3, inputs)
    }

    this.state.region = inputs.region
    this.state.enabled = inputs.enabled
    this.state.origins = inputs.origins
    this.state.defaults = inputs.defaults

    console.log(`CloudFront deployed successfully with URL: ${this.state.url}.`)

    return {
      name: inputs.name,
      id: this.state.id,
      arn: this.state.arn,
      url: this.state.url
    }
  }

  /**
   * Remove
   * @param {*} inputs
   */
  async remove(inputs = {}) {
    if (!this.state.id) {
      return
    }

    const cf = new aws.CloudFront({
      credentials: this.credentials.aws,
      region: this.state.region
    })

    await deleteCloudFrontDistribution(cf, this.state.id)

    this.state = {}

    console.log(`CloudFront distribution was successfully removed.`)
  }
}

module.exports = CloudFront
