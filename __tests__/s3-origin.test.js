const {
  mockCreateDistribution,
  mockUpdateDistribution,
  mockCreateDistributionPromise,
  mockGetDistributionConfigPromise,
  mockUpdateDistributionPromise,
  mockCreateCloudFrontOriginAccessIdentityPromise
} = require('aws-sdk')

const { createComponent } = require('../test-utils')

describe('Input origin as an S3 bucket url', () => {
  let component

  beforeEach(async () => {
    mockCreateDistributionPromise.mockResolvedValueOnce({
      Distribution: {
        Id: 'distributionwithS3origin'
      }
    })

    component = await createComponent()
  })

  it('creates distribution with S3 origin', async () => {
    await component.default({
      origins: ['https://mybucket.s3.amazonaws.com']
    })

    expect(mockCreateDistribution).toBeCalledWith(
      expect.objectContaining({
        DistributionConfig: expect.objectContaining({
          Origins: expect.objectContaining({
            Items: [
              {
                Id: 'mybucket',
                DomainName: 'mybucket.s3.amazonaws.com',
                S3OriginConfig: {
                  OriginAccessIdentity: ''
                },
                CustomHeaders: {
                  Quantity: 0,
                  Items: []
                },
                OriginPath: ''
              }
            ]
          })
        })
      })
    )
    expect(mockCreateDistribution.mock.calls[0][0]).toMatchSnapshot()
  })

  it('creates distribution configured to serve private S3 content', async () => {
    mockCreateCloudFrontOriginAccessIdentityPromise.mockResolvedValueOnce({
      CloudFrontOriginAccessIdentity: {
        Id: 'access-identity-xyz',
        S3CanonicalUserId: 's3-canonical-user-id-xyz'
      }
    })

    await component.default({
      origins: [
        {
          url: 'https://mybucket.s3.amazonaws.com',
          private: true
        }
      ]
    })

    expect(mockCreateDistribution).toBeCalledWith(
      expect.objectContaining({
        DistributionConfig: expect.objectContaining({
          Origins: expect.objectContaining({
            Items: [
              {
                Id: 'mybucket',
                DomainName: 'mybucket.s3.amazonaws.com',
                S3OriginConfig: {
                  OriginAccessIdentity: 'origin-access-identity/cloudfront/access-identity-xyz'
                },
                CustomHeaders: {
                  Quantity: 0,
                  Items: []
                },
                OriginPath: ''
              }
            ]
          })
        })
      })
    )
    expect(mockCreateDistribution.mock.calls[0][0]).toMatchSnapshot()
  })

  it('updates distribution configured to serve private S3 content', async () => {
    mockCreateCloudFrontOriginAccessIdentityPromise.mockResolvedValue({
      CloudFrontOriginAccessIdentity: {
        Id: 'access-identity-xyz',
        S3CanonicalUserId: 's3-canonical-user-id-xyz'
      }
    })

    mockGetDistributionConfigPromise.mockResolvedValueOnce({
      ETag: 'etag',
      DistributionConfig: {
        Origins: {
          Items: []
        }
      }
    })

    mockUpdateDistributionPromise.mockResolvedValueOnce({
      Distribution: {
        Id: 'distributionwithS3originupdated'
      }
    })

    await component.default({
      origins: [
        {
          url: 'https://mybucket.s3.amazonaws.com',
          private: true
        }
      ]
    })

    await component.default({
      origins: [
        {
          url: 'https://anotherbucket.s3.amazonaws.com',
          private: true
        }
      ]
    })

    expect(mockUpdateDistribution).toBeCalledWith(
      expect.objectContaining({
        DistributionConfig: expect.objectContaining({
          Origins: expect.objectContaining({
            Items: [
              {
                Id: 'anotherbucket',
                DomainName: 'anotherbucket.s3.amazonaws.com',
                S3OriginConfig: {
                  OriginAccessIdentity: 'origin-access-identity/cloudfront/access-identity-xyz'
                },
                OriginPath: '',
                CustomHeaders: { Items: [], Quantity: 0 }
              }
            ]
          })
        })
      })
    )
    expect(mockCreateDistribution.mock.calls[0][0]).toMatchSnapshot()
  })

  it('updates distribution', async () => {
    mockGetDistributionConfigPromise.mockResolvedValueOnce({
      ETag: 'etag',
      DistributionConfig: {
        Origins: {
          Items: []
        }
      }
    })
    mockUpdateDistributionPromise.mockResolvedValueOnce({
      Distribution: {
        Id: 'distributionwithS3originupdated'
      }
    })

    await component.default({
      origins: ['https://mybucket.s3.amazonaws.com']
    })

    await component.default({
      origins: ['https://anotherbucket.s3.amazonaws.com']
    })

    expect(mockUpdateDistribution).toBeCalledWith(
      expect.objectContaining({
        DistributionConfig: expect.objectContaining({
          Origins: expect.objectContaining({
            Items: [
              expect.objectContaining({
                Id: 'anotherbucket',
                DomainName: 'anotherbucket.s3.amazonaws.com'
              })
            ]
          })
        })
      })
    )

    expect(mockUpdateDistribution.mock.calls[0][0]).toMatchSnapshot()
  })
})
