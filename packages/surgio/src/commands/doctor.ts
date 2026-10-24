/* istanbul ignore file -- @preserve */
import BaseCommand from '../base-command.js'
import { generateDoctorInfo } from '../utils/doctor.js'

class DoctorCommand extends BaseCommand<typeof DoctorCommand> {
  static description = '检查运行环境'

  public async run(): Promise<void> {
    const doctorInfo = await generateDoctorInfo(
      this.projectDir,
      this.config.pjson,
    )

    doctorInfo.forEach((item) => {
      console.log(item)
    })

    await this.cleanup()
  }
}

export default DoctorCommand
